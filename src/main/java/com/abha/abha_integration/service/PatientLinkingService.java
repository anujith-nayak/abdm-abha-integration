package com.abha.abha_integration.service;

import com.abha.abha_integration.dto.PatientDto;
import com.abha.abha_integration.dto.PatientLinkResult;
import com.abha.abha_integration.dto.PatientLinkStatus;
import com.abha.abha_integration.dto.PatientProfileDto;
import com.abha.abha_integration.dto.PatientRegistrationRequest;
import com.abha.abha_integration.entity.Patient;
import com.abha.abha_integration.repository.PatientRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class PatientLinkingService {

    private static final int MAX_AGE_DIFFERENCE = 2;

    private final PatientRepository patientRepository;
    private final AbdmService abdmService;

    public PatientLinkingService(PatientRepository patientRepository,
                                 AbdmService abdmService) {
        this.patientRepository = patientRepository;
        this.abdmService = abdmService;
    }

    @Transactional
    public PatientLinkResult registerOrLink(PatientRegistrationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Patient registration request is required.");
        }

        if (request.isWithoutAbha()) {
            Patient patient = createPatient(request.getHospitalProfile(), null, false, request.getLinkedBy());
            patient.setMrdNumber(firstNonBlank(request.getMrdNumber(), patient.getMrdNumber()));
            applyHospitalFields(patient, request);
            patient = patientRepository.save(patient);
            return result(
                    PatientLinkStatus.PATIENT_CREATED_WITHOUT_ABHA,
                    "Patient created without ABHA.",
                    patient,
                    List.of(),
                    null,
                    PatientDto.fromEntity(patient).toProfile());
        }

        PatientProfileDto abhaProfile = verifyAbha(request);
        Optional<Patient> existingPatient = findExistingPatient(abhaProfile, request.getMrdNumber());

        if (request.getPatientId() != null) {
            return linkVerifiedAbhaProfile(request);
        }

        if (existingPatient.isEmpty()) {
            Patient patient = createPatient(abhaProfile, request.getMrdNumber(), true, request.getLinkedBy());
            applyHospitalFields(patient, request);
            patient = patientRepository.save(patient);
            return result(
                    PatientLinkStatus.NEW_PATIENT_CREATED,
                    "New patient created and ABHA Address linked.",
                    patient,
                    List.of(),
                    abhaProfile,
                    PatientDto.fromEntity(patient).toProfile());
        }

        Patient patient = existingPatient.get();
        PatientProfileDto hospitalProfile = PatientDto.fromEntity(patient).toProfile();
        return result(
                PatientLinkStatus.RETURNING_PATIENT_FOUND,
                "Returning patient found. Confirm before linking ABHA Address.",
                patient,
                compareDemographics(hospitalProfile, abhaProfile),
                abhaProfile,
                hospitalProfile);
    }

    public PatientLinkResult determineRegistration(PatientRegistrationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Patient registration request is required.");
        }

        PatientProfileDto abhaProfile = verifyAbha(request);
        Optional<Patient> existingPatient = findExistingPatient(abhaProfile, null);
        if (existingPatient.isEmpty()) {
            return new PatientLinkResult(
                    PatientLinkStatus.NEW_PATIENT_READY,
                    "No matching hospital patient was found. Continue as a new patient.",
                    null,
                    List.of(),
                    abhaProfile,
                    abhaProfile);
        }

        Patient patient = existingPatient.get();
        PatientProfileDto hospitalProfile = PatientDto.fromEntity(patient).toProfile();
        return result(
                PatientLinkStatus.RETURNING_PATIENT_FOUND,
                "Returning patient found. Review and confirm ABHA linking.",
                patient,
                compareDemographics(hospitalProfile, abhaProfile),
                abhaProfile,
                hospitalProfile);
    }

    @Transactional
    public PatientLinkResult linkVerifiedAbhaProfile(PatientRegistrationRequest request) {
        if (request == null || request.getPatientId() == null) {
            throw new IllegalArgumentException("Matched patient ID is required for ABHA linking.");
        }

        PatientProfileDto abhaProfile = verifyAbha(request);
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Matched patient was not found."));
        PatientProfileDto originalHospitalProfile = PatientDto.fromEntity(patient).toProfile();
        List<String> mismatchReasons = compareDemographics(originalHospitalProfile, abhaProfile);
        if (!mismatchReasons.isEmpty()) {
            throw new IllegalArgumentException(
                    "ABHA profile does not match the selected hospital patient.");
        }
        Patient linkedPatient = linkPatient(patient, abhaProfile, request.getLinkedBy());
        applyHospitalFields(linkedPatient, request);
        linkedPatient = patientRepository.save(linkedPatient);
        return result(
                PatientLinkStatus.PATIENT_LINKED,
                "ABHA Address linked and hospital demographics updated from verified ABHA profile.",
                linkedPatient,
                mismatchReasons,
                abhaProfile,
                PatientDto.fromEntity(linkedPatient).toProfile());
    }

    public PatientProfileDto verifyAbha(PatientRegistrationRequest request) {
        String requestedAddress = firstNonBlank(
                request.getAbhaAddress(),
                request.getAbhaProfile() == null ? null : request.getAbhaProfile().getAbhaAddress());

        PatientProfileDto profile = abdmService.fetchVerifiedPatientProfile(requestedAddress)
                .orElseGet(() -> fetchAbhaProfile(requestedAddress));

        if (profile == null || isBlank(profile.getAbhaAddress())) {
            throw new IllegalArgumentException("A successfully verified ABHA profile is required for linking.");
        }

        return profile;
    }

    public PatientProfileDto fetchAbhaProfile(String abhaAddress) {
        return abdmService.fetchVerifiedAbhaProfile(abhaAddress)
                .map(PatientProfileDto::fromVerifyOtpResponse)
                .orElseThrow(() -> new IllegalStateException(
                        "No verified ABHA profile is available. Complete ABDM verification or scan an ABHA QR profile first."));
    }

    public Optional<Patient> findExistingPatient(PatientProfileDto abhaProfile, String mrdNumber) {
        if (!isBlank(mrdNumber)) {
            return patientRepository.findByMrdNumber(mrdNumber);
        }

        if (!isBlank(abhaProfile.getAbhaAddress())) {
            Optional<Patient> linkedPatient =
                    patientRepository.findByAbhaAddress(abhaProfile.getAbhaAddress());
            if (linkedPatient.isPresent()) {
                return linkedPatient;
            }
        }

        List<Patient> candidates =
                patientRepository.findCandidates(blankToNull(abhaProfile.getMobileNumber()));
        if (candidates.isEmpty()) {
            return Optional.empty();
        }

        return candidates.stream()
                .filter(patient -> compareDemographics(
                        PatientDto.fromEntity(patient).toProfile(),
                        abhaProfile).isEmpty())
                .min(Comparator.comparing(patient -> compareDemographics(
                        PatientDto.fromEntity(patient).toProfile(),
                        abhaProfile).size()));
    }

    public List<String> compareDemographics(PatientProfileDto hospitalProfile,
                                            PatientProfileDto abhaProfile) {
        List<String> mismatchReasons = new ArrayList<>();

        if (!equalsExact(hospitalProfile.getMobileNumber(), abhaProfile.getMobileNumber())) {
            mismatchReasons.add("Mobile mismatch");
        }

        if (!equalsExact(hospitalProfile.getGender(), abhaProfile.getGender())) {
            mismatchReasons.add("Gender mismatch");
        }

        if (!ageMatches(hospitalProfile, abhaProfile)) {
            mismatchReasons.add("Age mismatch");
        }

        if (!nameMatches(hospitalProfile.getName(), abhaProfile.getName())) {
            mismatchReasons.add("Name mismatch");
        }

        return mismatchReasons;
    }

    public Patient linkPatient(Patient patient,
                               PatientProfileDto abhaProfile,
                               String linkedBy) {
        updatePatient(patient, abhaProfile);
        patient.setAbhaAddress(abhaProfile.getAbhaAddress());
        patient.setAbhaNumber(abhaProfile.getAbhaNumber());
        patient.setAbhaLinked(true);
        patient.setLinkedDate(OffsetDateTime.now());
        patient.setLinkedBy(linkedBy);
        return patient;
    }

    public Patient createPatient(PatientProfileDto profile,
                                 String mrdNumber,
                                 boolean abhaLinked,
                                 String linkedBy) {
        Patient patient = new Patient();
        patient.setMrdNumber(mrdNumber);
        copyProfile(patient, profile, true);
        patient.setAbhaLinked(abhaLinked);
        if (abhaLinked) {
            patient.setLinkedDate(OffsetDateTime.now());
            patient.setLinkedBy(linkedBy);
        }
        return patient;
    }

    public Patient updatePatient(Patient patient,
                                 PatientProfileDto profile) {
        copyProfile(patient, profile, false);
        return patient;
    }

    public PatientLinkResult markForManualReview(PatientRegistrationRequest request) {
        PatientProfileDto abhaProfile = request.getAbhaProfile();
        PatientProfileDto hospitalProfile = request.getHospitalProfile();
        PatientDto matchedPatient = null;

        if (!isBlank(request.getMrdNumber())) {
            matchedPatient = patientRepository.findByMrdNumber(request.getMrdNumber())
                    .map(PatientDto::fromEntity)
                    .orElse(null);
        }

        return new PatientLinkResult(
                PatientLinkStatus.LINK_REVIEW_REQUIRED,
                "Patient sent for manual review.",
                matchedPatient,
                compareIfAvailable(hospitalProfile, abhaProfile),
                abhaProfile,
                hospitalProfile);
    }

    private List<String> compareIfAvailable(PatientProfileDto hospitalProfile,
                                            PatientProfileDto abhaProfile) {
        if (hospitalProfile == null || abhaProfile == null) {
            return List.of();
        }
        return compareDemographics(hospitalProfile, abhaProfile);
    }

    private PatientLinkResult result(PatientLinkStatus status,
                                     String message,
                                     Patient patient,
                                     List<String> mismatchReasons,
                                     PatientProfileDto abhaProfile,
                                     PatientProfileDto hospitalProfile) {
        return new PatientLinkResult(
                status,
                message,
                PatientDto.fromEntity(patient),
                mismatchReasons,
                abhaProfile,
                hospitalProfile);
    }

    private void copyProfile(Patient patient,
                             PatientProfileDto profile,
                             boolean copyNulls) {
        if (profile == null) {
            return;
        }

        setIfAllowed(profile.getName(), copyNulls, patient::setName);
        setIfAllowed(profile.getGender(), copyNulls, patient::setGender);
        setIfAllowed(profile.getDob(), copyNulls, patient::setDob);
        setIfAllowed(profile.getAge(), copyNulls, patient::setAge);
        setIfAllowed(profile.getMobileNumber(), copyNulls, patient::setMobileNumber);
        setIfAllowed(profile.getAddress(), copyNulls, patient::setAddress);
        setIfAllowed(profile.getState(), copyNulls, patient::setState);
        setIfAllowed(profile.getDistrict(), copyNulls, patient::setDistrict);
        setIfAllowed(profile.getPincode(), copyNulls, patient::setPincode);
        setIfAllowed(profile.getAbhaAddress(), copyNulls, patient::setAbhaAddress);
        setIfAllowed(profile.getAbhaNumber(), copyNulls, patient::setAbhaNumber);
    }

    private void applyHospitalFields(Patient patient, PatientRegistrationRequest request) {
        if (request == null) {
            return;
        }

        setIfAllowed(request.getMrdNumber(), false, patient::setMrdNumber);
        setIfAllowed(request.getDepartment(), false, patient::setDepartment);
        setIfAllowed(request.getDoctor(), false, patient::setDoctor);
        setIfAllowed(request.getVisitType(), false, patient::setVisitType);
    }

    private void setIfAllowed(String value,
                              boolean copyNulls,
                              java.util.function.Consumer<String> setter) {
        if (copyNulls || value != null) {
            setter.accept(value);
        }
    }

    private boolean ageMatches(PatientProfileDto hospitalProfile,
                               PatientProfileDto abhaProfile) {
        Optional<Integer> hospitalAge = ageOf(hospitalProfile);
        Optional<Integer> abhaAge = ageOf(abhaProfile);
        if (hospitalAge.isEmpty() || abhaAge.isEmpty()) {
            return false;
        }
        return Math.abs(hospitalAge.get() - abhaAge.get()) <= MAX_AGE_DIFFERENCE;
    }

    private Optional<Integer> ageOf(PatientProfileDto profile) {
        if (profile == null) {
            return Optional.empty();
        }

        Optional<Integer> age = parseInteger(profile.getAge());
        if (age.isPresent()) {
            return age;
        }

        return ageFromDob(profile.getDob());
    }

    private Optional<Integer> parseInteger(String value) {
        if (isBlank(value)) {
            return Optional.empty();
        }

        String digits = value.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Integer.parseInt(digits));
        }
        catch (NumberFormatException ignored) {
            return Optional.empty();
        }
    }

    private Optional<Integer> ageFromDob(String dob) {
        if (isBlank(dob)) {
            return Optional.empty();
        }

        String value = dob.trim();
        if (value.matches("\\d{4}")) {
            return Optional.of(Year.now().getValue() - Integer.parseInt(value));
        }

        for (DateTimeFormatter formatter : dateFormatters()) {
            try {
                LocalDate birthDate = LocalDate.parse(value, formatter);
                return Optional.of(Period.between(birthDate, LocalDate.now()).getYears());
            }
            catch (DateTimeParseException ignored) {
                // Try the next commonly returned ABDM/HMIS date shape.
            }
        }

        return Optional.empty();
    }

    private List<DateTimeFormatter> dateFormatters() {
        return List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd-MM-uuuu"),
                DateTimeFormatter.ofPattern("dd/MM/uuuu"),
                DateTimeFormatter.ofPattern("uuuu/MM/dd"));
    }

    private boolean nameMatches(String hospitalName, String abhaName) {
        String left = comparableName(hospitalName);
        String right = comparableName(abhaName);
        if (left.isBlank() || right.isBlank()) {
            return false;
        }

        if (left.equals(right)) {
            return true;
        }

        int distance = levenshteinDistance(left, right);
        int maxLength = Math.max(left.length(), right.length());
        double similarity = 1.0 - ((double) distance / maxLength);
        return distance <= 2 || similarity >= 0.82;
    }

    private String comparableName(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private int levenshteinDistance(String left, String right) {
        int[] previous = new int[right.length() + 1];
        int[] current = new int[right.length() + 1];

        for (int j = 0; j <= right.length(); j++) {
            previous[j] = j;
        }

        for (int i = 1; i <= left.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= right.length(); j++) {
                int substitutionCost = left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                        Math.min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + substitutionCost);
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }

        return previous[right.length()];
    }

    private boolean equalsExact(String left, String right) {
        return left != null && left.equals(right);
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }
}

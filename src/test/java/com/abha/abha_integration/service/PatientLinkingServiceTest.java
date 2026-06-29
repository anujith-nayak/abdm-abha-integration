package com.abha.abha_integration.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.abha.abha_integration.dto.PatientLinkResult;
import com.abha.abha_integration.dto.PatientLinkStatus;
import com.abha.abha_integration.dto.PatientProfileDto;
import com.abha.abha_integration.dto.PatientRegistrationRequest;
import com.abha.abha_integration.entity.Patient;
import com.abha.abha_integration.repository.PatientRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PatientLinkingServiceTest {

    private PatientRepository patientRepository;
    private AbdmService abdmService;
    private PatientLinkingService patientLinkingService;

    @BeforeEach
    void setUp() {
        patientRepository = mock(PatientRepository.class);
        abdmService = mock(AbdmService.class);
        patientLinkingService = new PatientLinkingService(
                patientRepository,
                abdmService);
        when(patientRepository.save(any(Patient.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createsNewPatientAndLinksAbhaWhenNoHospitalRecordExists() {
        PatientProfileDto profile = abhaProfile("Rahul Sharma");
        PatientRegistrationRequest request = requestWithAbha(profile);
        when(abdmService.fetchVerifiedPatientProfile("rahul@abdm")).thenReturn(Optional.of(profile));
        when(patientRepository.findByAbhaAddress("rahul@abdm")).thenReturn(Optional.empty());
        when(patientRepository.findCandidates("9999999999")).thenReturn(List.of());

        PatientLinkResult result = patientLinkingService.registerOrLink(request);

        assertThat(result.getStatus()).isEqualTo(PatientLinkStatus.NEW_PATIENT_CREATED);
        assertThat(result.getMatchedPatient().isAbhaLinked()).isTrue();
        assertThat(result.getMatchedPatient().getName()).isEqualTo("Rahul Sharma");
        assertThat(result.getMatchedPatient().getAbhaAddress()).isEqualTo("rahul@abdm");
    }

    @Test
    void findsReturningPatientWhenAllRulesPass() {
        Patient existing = existingPatient("Rahul Sharms");
        PatientProfileDto profile = abhaProfile("Rahul Sharma");
        PatientRegistrationRequest request = requestWithAbha(profile);
        when(abdmService.fetchVerifiedPatientProfile("rahul@abdm")).thenReturn(Optional.of(profile));
        when(patientRepository.findByAbhaAddress("rahul@abdm")).thenReturn(Optional.empty());
        when(patientRepository.findCandidates("9999999999")).thenReturn(List.of(existing));

        PatientLinkResult result = patientLinkingService.determineRegistration(request);

        assertThat(result.getStatus()).isEqualTo(PatientLinkStatus.RETURNING_PATIENT_FOUND);
        assertThat(result.getMismatchReasons()).isEmpty();
        assertThat(result.getMatchedPatient().getName()).isEqualTo("Rahul Sharms");
        assertThat(result.getMatchedPatient().isAbhaLinked()).isFalse();
    }

    @Test
    void treatsMismatchAsNewPatientCandidateMiss() {
        Patient existing = existingPatient("Rahul Sharma");
        existing.setMobileNumber("8888888888");
        existing.setGender("F");
        existing.setDob("1985-01-01");

        PatientProfileDto profile = abhaProfile("Rahul Sharma");
        PatientRegistrationRequest request = requestWithAbha(profile);
        when(abdmService.fetchVerifiedPatientProfile("rahul@abdm")).thenReturn(Optional.of(profile));
        when(patientRepository.findByAbhaAddress("rahul@abdm")).thenReturn(Optional.empty());
        when(patientRepository.findCandidates("9999999999")).thenReturn(List.of(existing));

        PatientLinkResult result = patientLinkingService.determineRegistration(request);

        assertThat(result.getStatus()).isEqualTo(PatientLinkStatus.NEW_PATIENT_READY);
        assertThat(result.getMatchedPatient()).isNull();
        assertThat(existing.isAbhaLinked()).isFalse();
    }

    @Test
    void confirmLinkUpdatesReturningPatient() {
        Patient existing = existingPatient("Rahul Sharma");
        PatientProfileDto profile = abhaProfile("Rahul Sharma");
        PatientRegistrationRequest request = requestWithAbha(profile);
        request.setPatientId(1L);
        request.setMrdNumber("MRD-7");
        request.setDepartment("Cardiology");
        when(abdmService.fetchVerifiedPatientProfile("rahul@abdm")).thenReturn(Optional.of(profile));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(existing));

        PatientLinkResult result = patientLinkingService.linkVerifiedAbhaProfile(request);

        assertThat(result.getStatus()).isEqualTo(PatientLinkStatus.PATIENT_LINKED);
        assertThat(result.getMatchedPatient().isAbhaLinked()).isTrue();
        assertThat(result.getMatchedPatient().getName()).isEqualTo("Rahul Sharma");
        assertThat(result.getMatchedPatient().getDepartment()).isEqualTo("Cardiology");
    }

    @Test
    void createsPatientWithoutAbhaWhenPatientDoesNotShareAbha() {
        PatientRegistrationRequest request = new PatientRegistrationRequest();
        request.setWithoutAbha(true);
        request.setMrdNumber("MRD-8");
        request.setHospitalProfile(hospitalProfile());

        PatientLinkResult result = patientLinkingService.registerOrLink(request);

        assertThat(result.getStatus()).isEqualTo(PatientLinkStatus.PATIENT_CREATED_WITHOUT_ABHA);
        assertThat(result.getMatchedPatient().isAbhaLinked()).isFalse();
        assertThat(result.getMatchedPatient().getMrdNumber()).isEqualTo("MRD-8");
    }

    @Test
    void comparisonReportsNameMismatchForDistantName() {
        PatientProfileDto hospital = hospitalProfile();
        PatientProfileDto abha = abhaProfile("Amit Verma");

        assertThat(patientLinkingService.compareDemographics(hospital, abha))
                .contains("Name mismatch");
    }

    private PatientRegistrationRequest requestWithAbha(PatientProfileDto abhaProfile) {
        PatientRegistrationRequest request = new PatientRegistrationRequest();
        request.setAbhaProfile(abhaProfile);
        request.setLinkedBy("front-desk");
        return request;
    }

    private Patient existingPatient(String name) {
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setMrdNumber("MRD-1");
        patient.setName(name);
        patient.setGender("M");
        patient.setDob("1990-01-01");
        patient.setMobileNumber("9999999999");
        return patient;
    }

    private PatientProfileDto hospitalProfile() {
        PatientProfileDto profile = new PatientProfileDto();
        profile.setName("Rahul Sharma");
        profile.setGender("M");
        profile.setDob("1990-01-01");
        profile.setMobileNumber("9999999999");
        profile.setAddress("12 MG Road");
        profile.setState("Karnataka");
        profile.setDistrict("Bengaluru");
        profile.setPincode("560001");
        return profile;
    }

    private PatientProfileDto abhaProfile(String name) {
        PatientProfileDto profile = hospitalProfile();
        profile.setName(name);
        profile.setAbhaNumber("12-3456-7890-1234");
        profile.setAbhaAddress("rahul@abdm");
        return profile;
    }
}

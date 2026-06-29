package com.abha.abha_integration.dto;

import java.util.ArrayList;
import java.util.List;

public class PatientLinkResult {

    private PatientLinkStatus status;
    private String message;
    private PatientDto matchedPatient;
    private List<String> mismatchReasons = new ArrayList<>();
    private PatientProfileDto abhaProfile;
    private PatientProfileDto hospitalProfile;

    public PatientLinkResult() {
    }

    public PatientLinkResult(PatientLinkStatus status,
                             String message,
                             PatientDto matchedPatient,
                             List<String> mismatchReasons,
                             PatientProfileDto abhaProfile,
                             PatientProfileDto hospitalProfile) {
        this.status = status;
        this.message = message;
        this.matchedPatient = matchedPatient;
        this.mismatchReasons = mismatchReasons == null ? new ArrayList<>() : mismatchReasons;
        this.abhaProfile = abhaProfile;
        this.hospitalProfile = hospitalProfile;
    }

    public PatientLinkStatus getStatus() {
        return status;
    }

    public void setStatus(PatientLinkStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public PatientDto getMatchedPatient() {
        return matchedPatient;
    }

    public void setMatchedPatient(PatientDto matchedPatient) {
        this.matchedPatient = matchedPatient;
    }

    public List<String> getMismatchReasons() {
        return mismatchReasons;
    }

    public void setMismatchReasons(List<String> mismatchReasons) {
        this.mismatchReasons = mismatchReasons;
    }

    public PatientProfileDto getAbhaProfile() {
        return abhaProfile;
    }

    public void setAbhaProfile(PatientProfileDto abhaProfile) {
        this.abhaProfile = abhaProfile;
    }

    public PatientProfileDto getHospitalProfile() {
        return hospitalProfile;
    }

    public void setHospitalProfile(PatientProfileDto hospitalProfile) {
        this.hospitalProfile = hospitalProfile;
    }
}

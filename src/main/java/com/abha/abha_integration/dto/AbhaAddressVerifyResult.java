package com.abha.abha_integration.dto;

import java.util.Map;

public class AbhaAddressVerifyResult {

    private String message;
    private PatientProfileDto abhaProfile;
    private Map<String, Object> abdmResponse;

    public AbhaAddressVerifyResult(String message,
                                   PatientProfileDto abhaProfile,
                                   Map<String, Object> abdmResponse) {
        this.message = message;
        this.abhaProfile = abhaProfile;
        this.abdmResponse = abdmResponse;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public PatientProfileDto getAbhaProfile() {
        return abhaProfile;
    }

    public void setAbhaProfile(PatientProfileDto abhaProfile) {
        this.abhaProfile = abhaProfile;
    }

    public Map<String, Object> getAbdmResponse() {
        return abdmResponse;
    }

    public void setAbdmResponse(Map<String, Object> abdmResponse) {
        this.abdmResponse = abdmResponse;
    }
}

package com.abha.abha_integration.dto;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VerifyOtpResponse {

    private String txnId;
    private String abhaNumber;
    private String abhaAddress;
    private String healthIdNumber;
    private String healthId;
    private String name;
    private String gender;
    private String dob;
    private final Map<String, Object> additionalProperties =
            new LinkedHashMap<>();

    public String getTxnId() {
        return txnId;
    }

    public void setTxnId(String txnId) {
        this.txnId = txnId;
    }

    public String getAbhaNumber() {
        return abhaNumber;
    }

    public void setAbhaNumber(String abhaNumber) {
        this.abhaNumber = abhaNumber;
    }

    public String getAbhaAddress() {
        return abhaAddress;
    }

    public void setAbhaAddress(String abhaAddress) {
        this.abhaAddress = abhaAddress;
    }

    public String getHealthIdNumber() {
        return healthIdNumber;
    }

    public void setHealthIdNumber(String healthIdNumber) {
        this.healthIdNumber = healthIdNumber;
    }

    public String getHealthId() {
        return healthId;
    }

    public void setHealthId(String healthId) {
        this.healthId = healthId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    @JsonAnySetter
    public void setAdditionalProperty(String key, Object value) {
        additionalProperties.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return additionalProperties;
    }
}

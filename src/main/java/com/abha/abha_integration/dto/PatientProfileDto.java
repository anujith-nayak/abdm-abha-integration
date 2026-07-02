package com.abha.abha_integration.dto;

import java.util.List;
import java.util.Map;

public class PatientProfileDto {

    private String name;
    private String gender;
    private String dob;
    private String age;
    private String mobileNumber;
    private String abhaNumber;
    private String abhaAddress;
    private String address;
    private String state;
    private String district;
    private String pincode;

    public static PatientProfileDto fromVerifyOtpResponse(VerifyOtpResponse response) {
        if (response == null) {
            return null;
        }

        PatientProfileDto profile = new PatientProfileDto();
        profile.setName(firstNonBlank(
                response.getName(),
                value(response.getAdditionalProperties(), "fullName"),
                value(response.getAdditionalProperties(), "firstName")));
        profile.setGender(response.getGender());
        profile.setDob(firstNonBlank(
                response.getDob(),
                value(response.getAdditionalProperties(), "dateOfBirth"),
                value(response.getAdditionalProperties(), "yearOfBirth")));
        profile.setMobileNumber(firstNonBlank(
                value(response.getAdditionalProperties(), "mobileNumber"),
                value(response.getAdditionalProperties(), "mobile"),
                value(response.getAdditionalProperties(), "phone")));
        profile.setAbhaNumber(firstNonBlank(
                response.getAbhaNumber(),
                response.getHealthIdNumber()));
        profile.setAbhaAddress(firstNonBlank(
                response.getAbhaAddress(),
                response.getHealthId(),
                value(response.getAdditionalProperties(), "preferredAbhaAddress"),
                value(response.getAdditionalProperties(), "phrAddress")));
        profile.setAddress(value(response.getAdditionalProperties(), "address"));
        profile.setState(firstNonBlank(
                value(response.getAdditionalProperties(), "state"),
                value(response.getAdditionalProperties(), "stateName")));
        profile.setDistrict(firstNonBlank(
                value(response.getAdditionalProperties(), "district"),
                value(response.getAdditionalProperties(), "districtName")));
        profile.setPincode(firstNonBlank(
                value(response.getAdditionalProperties(), "pincode"),
                value(response.getAdditionalProperties(), "pinCode")));
        return profile;
    }

    public static PatientProfileDto fromMap(Map<String, Object> source) {
        if (source == null) {
            return null;
        }

        PatientProfileDto profile = new PatientProfileDto();
        profile.setName(firstNested(source, "name", "fullName", "patientName", "firstName"));
        profile.setGender(firstNested(source, "gender"));
        profile.setDob(firstNested(source, "dob", "dateOfBirth", "yearOfBirth"));
        // ABDM Sandbox returns age=0 when demographic age is unavailable.
        // Treat it as unknown instead of a real age.
        String age = firstNested(source, "age");
        if ("0".equals(age)) {
            age = null;
        }
        profile.setAge(age);
        profile.setMobileNumber(firstNested(source, "mobileNumber", "mobile", "phone"));
        profile.setAbhaNumber(firstNested(source, "abhaNumber", "ABHANumber", "healthIdNumber"));
        profile.setAbhaAddress(firstNested(source, "abhaAddress", "healthId", "preferredAbhaAddress", "phrAddress"));
        profile.setAddress(firstNested(source, "address"));
        profile.setState(firstNested(source, "state", "stateName"));
        profile.setDistrict(firstNested(source, "district", "districtName"));
        profile.setPincode(firstNested(source, "pincode", "pinCode"));
        return profile;
    }

    private static String value(Map<String, Object> source, String key) {
        if (source == null) {
            return null;
        }

        Object value = source.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String firstNested(Map<String, Object> source, String... keys) {
        // 1. Check direct keys on this level first
        for (String key : keys) {
            String directValue = value(source, key);
            if (directValue != null && !directValue.isBlank()) {
                return directValue;
            }
        }

        // 2. Recurse into nested Maps and Lists
        for (Object nested : source.values()) {
            String found = searchNestedObject(nested, keys);
            if (found != null && !found.isBlank()) {
                return found;
            }
        }

        return null;
    }

    /**
     * Recursively searches for any of the given keys inside a nested object,
     * which may be a Map, a List of Maps, or a List of Lists.
     */
    @SuppressWarnings("unchecked")
    private static String searchNestedObject(Object obj, String... keys) {
        if (obj instanceof Map<?, ?> rawMap) {
            // Convert to Map<String, Object> and recurse
            Map<String, Object> nestedMap = new java.util.LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                if (entry.getKey() != null) {
                    nestedMap.put(String.valueOf(entry.getKey()), entry.getValue());
                }
            }
            return firstNested(nestedMap, keys);
        }

        if (obj instanceof List<?> list) {
            // Iterate every element in the list and recurse
            for (Object item : list) {
                String found = searchNestedObject(item, keys);
                if (found != null && !found.isBlank()) {
                    return found;
                }
            }
        }

        return null;
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

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }
}

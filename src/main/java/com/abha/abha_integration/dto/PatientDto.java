package com.abha.abha_integration.dto;

import com.abha.abha_integration.entity.Patient;
import java.time.OffsetDateTime;

public class PatientDto {

    private Long id;
    private String mrdNumber;
    private String name;
    private String gender;
    private String dob;
    private String age;
    private String mobileNumber;
    private String address;
    private String state;
    private String district;
    private String pincode;
    private String abhaAddress;
    private String abhaNumber;
    private boolean abhaLinked;
    private OffsetDateTime linkedDate;
    private String linkedBy;

    public static PatientDto fromEntity(Patient patient) {
        if (patient == null) {
            return null;
        }

        PatientDto dto = new PatientDto();
        dto.setId(patient.getId());
        dto.setMrdNumber(patient.getMrdNumber());
        dto.setName(patient.getName());
        dto.setGender(patient.getGender());
        dto.setDob(patient.getDob());
        dto.setAge(patient.getAge());
        dto.setMobileNumber(patient.getMobileNumber());
        dto.setAddress(patient.getAddress());
        dto.setState(patient.getState());
        dto.setDistrict(patient.getDistrict());
        dto.setPincode(patient.getPincode());
        dto.setAbhaAddress(patient.getAbhaAddress());
        dto.setAbhaNumber(patient.getAbhaNumber());
        dto.setAbhaLinked(patient.isAbhaLinked());
        dto.setLinkedDate(patient.getLinkedDate());
        dto.setLinkedBy(patient.getLinkedBy());
        return dto;
    }

    public PatientProfileDto toProfile() {
        PatientProfileDto profile = new PatientProfileDto();
        profile.setName(name);
        profile.setGender(gender);
        profile.setDob(dob);
        profile.setAge(age);
        profile.setMobileNumber(mobileNumber);
        profile.setAbhaNumber(abhaNumber);
        profile.setAbhaAddress(abhaAddress);
        profile.setAddress(address);
        profile.setState(state);
        profile.setDistrict(district);
        profile.setPincode(pincode);
        return profile;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMrdNumber() {
        return mrdNumber;
    }

    public void setMrdNumber(String mrdNumber) {
        this.mrdNumber = mrdNumber;
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

    public String getAbhaAddress() {
        return abhaAddress;
    }

    public void setAbhaAddress(String abhaAddress) {
        this.abhaAddress = abhaAddress;
    }

    public String getAbhaNumber() {
        return abhaNumber;
    }

    public void setAbhaNumber(String abhaNumber) {
        this.abhaNumber = abhaNumber;
    }

    public boolean isAbhaLinked() {
        return abhaLinked;
    }

    public void setAbhaLinked(boolean abhaLinked) {
        this.abhaLinked = abhaLinked;
    }

    public OffsetDateTime getLinkedDate() {
        return linkedDate;
    }

    public void setLinkedDate(OffsetDateTime linkedDate) {
        this.linkedDate = linkedDate;
    }

    public String getLinkedBy() {
        return linkedBy;
    }

    public void setLinkedBy(String linkedBy) {
        this.linkedBy = linkedBy;
    }
}

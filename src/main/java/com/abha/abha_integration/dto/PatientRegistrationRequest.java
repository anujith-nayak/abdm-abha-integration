package com.abha.abha_integration.dto;

public class PatientRegistrationRequest {

    private Long patientId;
    private String mrdNumber;
    private String abhaAddress;
    private String linkedBy;
    private String department;
    private String doctor;
    private String visitType;
    private boolean withoutAbha;
    private PatientProfileDto abhaProfile;
    private PatientProfileDto hospitalProfile;

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getMrdNumber() {
        return mrdNumber;
    }

    public void setMrdNumber(String mrdNumber) {
        this.mrdNumber = mrdNumber;
    }

    public String getAbhaAddress() {
        return abhaAddress;
    }

    public void setAbhaAddress(String abhaAddress) {
        this.abhaAddress = abhaAddress;
    }

    public String getLinkedBy() {
        return linkedBy;
    }

    public void setLinkedBy(String linkedBy) {
        this.linkedBy = linkedBy;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDoctor() {
        return doctor;
    }

    public void setDoctor(String doctor) {
        this.doctor = doctor;
    }

    public String getVisitType() {
        return visitType;
    }

    public void setVisitType(String visitType) {
        this.visitType = visitType;
    }

    public boolean isWithoutAbha() {
        return withoutAbha;
    }

    public void setWithoutAbha(boolean withoutAbha) {
        this.withoutAbha = withoutAbha;
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

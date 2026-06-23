package com.abha.abha_integration.dto;

public class VerifyOtpInputRequest {

    private String otp;
    private String txnId;
    private String mobile;

    public VerifyOtpInputRequest() {
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getTxnId() {
        return txnId;
    }

    public void setTxnId(String txnId) {
        this.txnId = txnId;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
}

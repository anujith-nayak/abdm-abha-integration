package com.abha.abha_integration.dto;

import java.util.List;

public class VerifyOtpRequest {

    private AuthData authData;
    private Consent consent;

    public VerifyOtpRequest() {
    }

    public VerifyOtpRequest(AuthData authData,
                            Consent consent) {
        this.authData = authData;
        this.consent = consent;
    }

    public AuthData getAuthData() {
        return authData;
    }

    public void setAuthData(AuthData authData) {
        this.authData = authData;
    }

    public Consent getConsent() {
        return consent;
    }

    public void setConsent(Consent consent) {
        this.consent = consent;
    }

    public static class AuthData {

        private List<String> authMethods;
        private Otp otp;

        public AuthData() {
        }

        public AuthData(List<String> authMethods,
                        Otp otp) {
            this.authMethods = authMethods;
            this.otp = otp;
        }

        public List<String> getAuthMethods() {
            return authMethods;
        }

        public void setAuthMethods(List<String> authMethods) {
            this.authMethods = authMethods;
        }

        public Otp getOtp() {
            return otp;
        }

        public void setOtp(Otp otp) {
            this.otp = otp;
        }
    }

    public static class Otp {

        private String txnId;
        private String otpValue;
        private String mobile;

        public Otp() {
        }

        public Otp(String txnId,
                   String otpValue,
                   String mobile) {
            this.txnId = txnId;
            this.otpValue = otpValue;
            this.mobile = mobile;
        }

        public String getTxnId() {
            return txnId;
        }

        public void setTxnId(String txnId) {
            this.txnId = txnId;
        }

        public String getOtpValue() {
            return otpValue;
        }

        public void setOtpValue(String otpValue) {
            this.otpValue = otpValue;
        }

        public String getMobile() {
            return mobile;
        }

        public void setMobile(String mobile) {
            this.mobile = mobile;
        }
    }

    public static class Consent {

        private String code;
        private String version;

        public Consent() {
        }

        public Consent(String code,
                       String version) {
            this.code = code;
            this.version = version;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }
    }
}

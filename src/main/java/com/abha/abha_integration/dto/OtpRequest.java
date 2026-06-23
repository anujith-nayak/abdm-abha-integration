package com.abha.abha_integration.dto;

import java.util.List;

public class OtpRequest {

    private String txnId;
    private List<String> scope;
    private String loginHint;
    private String loginId;
    private String otpSystem;

    public OtpRequest() {
    }

    public OtpRequest(String txnId, List<String> scope, String loginHint,
                      String loginId, String otpSystem) {
        this.txnId = txnId;
        this.scope = scope;
        this.loginHint = loginHint;
        this.loginId = loginId;
        this.otpSystem = otpSystem;
    }

    public String getTxnId() {
        return txnId;
    }

    public void setTxnId(String txnId) {
        this.txnId = txnId;
    }

    public List<String> getScope() {
        return scope;
    }

    public void setScope(List<String> scope) {
        this.scope = scope;
    }

    public String getLoginHint() {
        return loginHint;
    }

    public void setLoginHint(String loginHint) {
        this.loginHint = loginHint;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getOtpSystem() {
        return otpSystem;
    }

    public void setOtpSystem(String otpSystem) {
        this.otpSystem = otpSystem;
    }
}

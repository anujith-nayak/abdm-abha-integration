package com.abha.abha_integration.dto;

import lombok.Data;

@Data
public class TokenRequest {
    private String clientId;
    private String clientSecret;

    public TokenRequest() {
    }

    public TokenRequest(String clientId, String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
}

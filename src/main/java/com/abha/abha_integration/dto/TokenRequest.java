package com.abha.abha_integration.dto;

import lombok.Data;

@Data
public class TokenRequest {
    private String clientId;
    private String clientSecret;
}
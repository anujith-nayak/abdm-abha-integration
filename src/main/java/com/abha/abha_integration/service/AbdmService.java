package com.abha.abha_integration.service;

import com.abha.abha_integration.client.AbdmFeignClient;
import com.abha.abha_integration.dto.CertificateResponse;
import com.abha.abha_integration.dto.OtpRequest;
import com.abha.abha_integration.dto.OtpResponse;
import com.abha.abha_integration.dto.TokenRequest;
import com.abha.abha_integration.dto.TokenResponse;
import com.abha.abha_integration.dto.VerifyOtpRequest;
import com.abha.abha_integration.dto.VerifyOtpResponse;
import com.abha.abha_integration.util.EncryptionUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.net.URI;

@Service
public class AbdmService {

    private static final URI GATEWAY_BASE_URL =
            URI.create("https://dev.abdm.gov.in");
    private static final URI ABHA_BASE_URL =
            URI.create("https://abhasbx.abdm.gov.in");

    private final AbdmFeignClient abdmFeignClient;
    private final ObjectMapper objectMapper;
    private volatile String currentXToken;

    @Value("${abdm.client.id}")
    private String clientId;

    @Value("${abdm.client.secret}")
    private String clientSecret;

    public AbdmService(AbdmFeignClient abdmFeignClient,
                       ObjectMapper objectMapper) {
        this.abdmFeignClient = abdmFeignClient;
        this.objectMapper = objectMapper;
    }

    // STEP 1
    public String generateToken() {

        try {
            TokenResponse response =
                    abdmFeignClient.generateToken(
                            GATEWAY_BASE_URL,
                            new TokenRequest(clientId,
                                    clientSecret));

            if (response == null || response.getAccessToken() == null) {
                throw new IllegalStateException(
                        "ABDM token response did not contain accessToken");
            }

            return response.getAccessToken();
        }
        catch (FeignException e) {
            throw buildFeignException(
                    "Unable to generate ABDM token",
                    e);
        }
    }

    // STEP 2
    public String getPublicKey(String token){

        try {
            CertificateResponse response =
                    abdmFeignClient.getPublicKey(
                            ABHA_BASE_URL,
                            bearerToken(token),
                            requestId(),
                            timestamp());

            if (response == null || response.getPublicKey() == null) {
                throw new IllegalStateException(
                        "ABDM certificate response did not contain publicKey");
            }

            return response.getPublicKey();
        }
        catch (FeignException e) {
            throw buildFeignException(
                    "Unable to fetch ABDM public key",
                    e);
        }
    }

    // STEP 3 + STEP 4
    public String generateOtp(String aadhaar)
            throws Exception {

        String token =
                generateToken();

        String publicKey =
                getPublicKey(token);

        String encrypted =
                EncryptionUtil.encrypt(
                        aadhaar,
                        publicKey);

        OtpRequest request =
                new OtpRequest(
                        "",
                        List.of("abha-enrol"),
                        "aadhaar",
                        encrypted,
                        "aadhaar");

        try {
            OtpResponse response =
                    abdmFeignClient.generateOtp(
                            ABHA_BASE_URL,
                            bearerToken(token),
                            requestId(),
                            timestamp(),
                            request);

            return toJson(response);
        }
        catch (FeignException e) {
            throw buildFeignException(
                    "Unable to generate ABDM OTP",
                    e);
        }
    }

    public String verifyOtp(
        String otp,
        String txnId,
        String mobile)
        throws Exception {

        String token =
                generateToken();

        String publicKey =
                getPublicKey(token);

        String encryptedOtp =
                EncryptionUtil.encrypt(
                        otp,
                        publicKey);

        VerifyOtpRequest request =
                new VerifyOtpRequest(
                        new VerifyOtpRequest.AuthData(
                                List.of("otp"),
                                new VerifyOtpRequest.Otp(
                                        txnId,
                                        encryptedOtp,
                                        mobile)),
                        new VerifyOtpRequest.Consent(
                                "abha-enrollment",
                                "1.4"));

        try {
            VerifyOtpResponse response =
                    abdmFeignClient.verifyOtp(
                            ABHA_BASE_URL,
                            bearerToken(token),
                            requestId(),
                            timestamp(),
                            request);

            currentXToken = extractXToken(response);
            return toJson(response);
        }
        catch (FeignException e) {
            throw buildFeignException(
                    "Unable to verify ABDM OTP",
                    e);
        }
    }

    public ResponseEntity<byte[]> downloadAbhaCard() {
        String xToken = currentXToken;
        if (xToken == null || xToken.isBlank()) {
            throw new IllegalStateException(
                    "No authenticated ABHA session is available. Please complete OTP verification first.");
        }

        String accessToken = generateToken();

        try {
            return abdmFeignClient.downloadAbhaCard(
                    ABHA_BASE_URL,
                    bearerToken(accessToken),
                    bearerToken(xToken),
                    requestId(),
                    timestamp());
        }
        catch (FeignException e) {
            throw buildFeignException(
                    "Unable to download ABHA card",
                    e);
        }
    }

    private String extractXToken(VerifyOtpResponse response) {
        if (response == null) {
            return null;
        }

        Object tokens = response.getAdditionalProperties().get("tokens");
        if (tokens instanceof Map<?, ?> tokenValues) {
            Object token = tokenValues.get("token");
            if (token instanceof String value && !value.isBlank()) {
                return value;
            }
        }

        for (String key : List.of("token", "xToken", "X-Token")) {
            Object token = response.getAdditionalProperties().get(key);
            if (token instanceof String value && !value.isBlank()) {
                return value;
            }
        }

        return null;
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }

    private String requestId() {
        return UUID.randomUUID().toString();
    }

    private String timestamp() {
        return Instant.now().toString();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        }
        catch (JsonProcessingException e) {
            throw new IllegalStateException(
                    "Unable to serialize ABDM response",
                    e);
        }
    }

    private RuntimeException buildFeignException(String message,
                                                 FeignException e) {
        String responseBody =
                e.contentUTF8();

        if (responseBody != null && !responseBody.isBlank()) {
            return new IllegalStateException(
                    message + " : " + responseBody,
                    e);
        }

        return new IllegalStateException(
                message + " : HTTP " + e.status(),
                e);
    }
}

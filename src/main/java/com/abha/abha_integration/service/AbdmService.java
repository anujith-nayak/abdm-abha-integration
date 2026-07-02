package com.abha.abha_integration.service;

import com.abha.abha_integration.client.AbdmFeignClient;
import com.abha.abha_integration.dto.CertificateResponse;
import com.abha.abha_integration.dto.OtpRequest;
import com.abha.abha_integration.dto.OtpResponse;
import com.abha.abha_integration.dto.PatientProfileDto;
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
    private volatile VerifyOtpResponse currentVerifiedProfile;
    private volatile PatientProfileDto currentVerifiedPatientProfile;

    // Session state for the ABHA address login flow.
    // Cached so that Search, Request OTP and Verify all use the same token + key.
    private volatile String abhaLoginAccessToken;
    private volatile String abhaLoginPublicKey;

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
            currentVerifiedProfile = response;
            currentVerifiedPatientProfile = PatientProfileDto.fromVerifyOtpResponse(response);
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

    public Map<String, Object> searchAbhaAddress(String abhaAddress) {
        if (abhaAddress == null || abhaAddress.isBlank()) {
            throw new IllegalArgumentException("ABHA Address is required.");
        }

        // Seed a fresh session token for this ABHA login flow.
        // The same token will be reused by Request OTP and Verify OTP.
        String accessToken = generateToken();
        abhaLoginAccessToken = accessToken;
        abhaLoginPublicKey = null;   // reset; will be fetched on first encryption need

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("scope", List.of("abha-address-login"));
        request.put("abhaAddress", abhaAddress);

        try {
            System.out.println("[ABDM] SEARCH ABHA REQUEST  URL  : "
                    + ABHA_BASE_URL + "/abha/api/v3/phr/web/login/abha/search");
            System.out.println("[ABDM] SEARCH ABHA REQUEST  BODY : " + safeJson(request));

            Map<String, Object> response = abdmFeignClient.searchAbhaAddress(
                    ABHA_BASE_URL,
                    bearerToken(accessToken),
                    requestId(),
                    timestamp(),
                    request);

            System.out.println("[ABDM] SEARCH ABHA RESPONSE BODY : " + safeJson(response));

            return response;
        }
        catch (FeignException e) {
            System.out.println("[ABDM] SEARCH ABHA ERROR  STATUS : " + e.status());
            System.out.println("[ABDM] SEARCH ABHA ERROR  BODY   : " + e.contentUTF8());
            throw buildFeignException("Unable to search ABHA Address", e);
        }
    }

    public Map<String, Object> requestAbhaAddressOtp(String abhaAddress,
                                                     String txnId)
            throws Exception {
        if (abhaAddress == null || abhaAddress.isBlank()) {
            throw new IllegalArgumentException("ABHA Address is required.");
        }

        // Reuse the session token seeded by searchAbhaAddress; fall back to a new token
        // only if called in isolation (e.g. direct API test).
        String accessToken = abhaLoginAccessToken != null ? abhaLoginAccessToken : generateToken();
        abhaLoginAccessToken = accessToken;

        String publicKey = getPublicKey(accessToken);
        abhaLoginPublicKey = publicKey;   // cache for verifyAbhaAddressOtp

        String encryptedAbhaAddress = EncryptionUtil.encrypt(abhaAddress, publicKey);

        Map<String, Object> request = new LinkedHashMap<>();
        // scope must match the ABDM V3 spec for /request/otp
        request.put("scope", List.of("abha-address-login", "mobile-verify"));
        request.put("loginHint", "abha-address");
        request.put("loginId", encryptedAbhaAddress);
        request.put("otpSystem", "abdm");
        if (txnId != null && !txnId.isBlank()) {
            request.put("txnId", txnId);
        }

        try {
            System.out.println("[ABDM] REQUEST OTP REQUEST  URL  : "
                    + ABHA_BASE_URL + "/abha/api/v3/phr/web/login/abha/request/otp");
            System.out.println("[ABDM] REQUEST OTP REQUEST  BODY : " + safeJson(request));

            Map<String, Object> response = abdmFeignClient.requestAbhaAddressOtp(
                    ABHA_BASE_URL,
                    bearerToken(accessToken),
                    requestId(),
                    timestamp(),
                    request);

            System.out.println("[ABDM] REQUEST OTP RESPONSE BODY : " + safeJson(response));

            return response;
        }
        catch (FeignException e) {
            System.out.println("[ABDM] REQUEST OTP ERROR  STATUS : " + e.status());
            System.out.println("[ABDM] REQUEST OTP ERROR  BODY   : " + e.contentUTF8());
            throw buildFeignException("Unable to request ABHA Address OTP", e);
        }
    }

    public Map<String, Object> verifyAbhaAddressOtp(String abhaAddress,
                                                    String txnId,
                                                    String otp)
            throws Exception {
        if (txnId == null || txnId.isBlank()) {
            throw new IllegalArgumentException("Transaction ID is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("OTP is required.");
        }

        // Reuse the same session token and public key from Request OTP.
        // Fall back to fresh values only if called in isolation.
        String accessToken = abhaLoginAccessToken != null ? abhaLoginAccessToken : generateToken();
        String publicKey   = abhaLoginPublicKey   != null ? abhaLoginPublicKey   : getPublicKey(accessToken);

        String encryptedOtp = EncryptionUtil.encrypt(otp, publicKey);

        // Exact body required by ABDM V3 /phr/web/login/abha/verify:
        //   scope      : ["abha-address-login", "mobile-verify"]
        //   authData   : { authMethods: ["otp"], otp: { txnId, otpValue } }
        Map<String, Object> otpPayload = new LinkedHashMap<>();
        otpPayload.put("txnId", txnId);
        otpPayload.put("otpValue", encryptedOtp);

        Map<String, Object> authData = new LinkedHashMap<>();
        authData.put("authMethods", List.of("otp"));
        authData.put("otp", otpPayload);

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("scope", List.of("abha-address-login", "mobile-verify"));
        request.put("authData", authData);

        // Log body with encrypted OTP masked
        Map<String, Object> maskedOtp = new LinkedHashMap<>(otpPayload);
        maskedOtp.put("otpValue", "[ENCRYPTED]");
        Map<String, Object> maskedAuth = new LinkedHashMap<>(authData);
        maskedAuth.put("otp", maskedOtp);
        Map<String, Object> maskedRequest = new LinkedHashMap<>(request);
        maskedRequest.put("authData", maskedAuth);

        try {
            System.out.println("[ABDM] VERIFY OTP REQUEST  URL  : "
                    + ABHA_BASE_URL + "/abha/api/v3/phr/web/login/abha/verify");
            System.out.println("[ABDM] VERIFY OTP REQUEST  BODY : " + safeJson(maskedRequest));

            Map<String, Object> response =
                    abdmFeignClient.verifyAbhaAddressOtp(
                            ABHA_BASE_URL,
                            bearerToken(accessToken),
                            requestId(),
                            timestamp(),
                            request);

            System.out.println("[ABDM] VERIFY OTP RESPONSE BODY : " + safeJson(response));

            // Guard: ABDM returns HTTP 200 even on OTP failure, with authResult="failed".
            // Only cache session state when the verification actually succeeded.
            Object authResult = response.get("authResult");
            if (!"success".equalsIgnoreCase(String.valueOf(authResult))) {
                // Return the raw ABDM response without caching anything.
                // The controller will surface the error message to the caller.
                return response;
            }

            currentXToken = extractXToken(response);
            currentVerifiedProfile =
                    objectMapper.convertValue(response, VerifyOtpResponse.class);
            currentVerifiedPatientProfile = extractVerifiedProfile(response, abhaAddress);
            return response;
        }
        catch (FeignException e) {
            System.out.println("[ABDM] VERIFY OTP ERROR  STATUS : " + e.status());
            System.out.println("[ABDM] VERIFY OTP ERROR  BODY   : " + e.contentUTF8());
            throw buildFeignException("Unable to verify ABHA Address OTP", e);
        }
    }

    public PatientProfileDto extractVerifiedProfile(Map<String, Object> response,
                                                    String abhaAddress) {
        System.out.println("[ABDM] RAW VERIFY OTP RESPONSE : " + response);

        PatientProfileDto profile = PatientProfileDto.fromMap(response);
        if (profile == null) {
            profile = new PatientProfileDto();
        }
        if ((profile.getAbhaAddress() == null || profile.getAbhaAddress().isBlank())
                && abhaAddress != null
                && !abhaAddress.isBlank()) {
            profile.setAbhaAddress(abhaAddress);
        }

        System.out.println("[ABDM] PARSED PatientProfileDto :");
        System.out.println("  Name        : " + profile.getName());
        System.out.println("  ABHA Number : " + profile.getAbhaNumber());
        System.out.println("  ABHA Address: " + profile.getAbhaAddress());
        System.out.println("  Age         : " + profile.getAge());
        System.out.println("  Gender      : " + profile.getGender());
        System.out.println("  DOB         : " + profile.getDob());
        System.out.println("  Mobile      : " + profile.getMobileNumber());

        return profile;
    }

    public Optional<VerifyOtpResponse> fetchVerifiedAbhaProfile(String abhaAddress) {
        VerifyOtpResponse profile = currentVerifiedProfile;
        if (profile == null) {
            return Optional.empty();
        }

        if (abhaAddress == null || abhaAddress.isBlank()) {
            return Optional.of(profile);
        }

        PatientProfileDto patientProfile =
                PatientProfileDto.fromVerifyOtpResponse(profile);
        if (patientProfile != null
                && abhaAddress.equals(patientProfile.getAbhaAddress())) {
            return Optional.of(profile);
        }

        return Optional.empty();
    }

    public Optional<PatientProfileDto> fetchVerifiedPatientProfile(String abhaAddress) {
        PatientProfileDto profile = currentVerifiedPatientProfile;
        if (profile == null) {
            return Optional.empty();
        }

        if (abhaAddress == null || abhaAddress.isBlank()) {
            return Optional.of(profile);
        }

        if (abhaAddress.equals(profile.getAbhaAddress())) {
            return Optional.of(profile);
        }

        return Optional.empty();
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

    private String extractXToken(Map<String, Object> response) {
        if (response == null) {
            return null;
        }

        Object tokens = response.get("tokens");
        if (tokens instanceof Map<?, ?> tokenValues) {
            Object token = tokenValues.get("token");
            if (token instanceof String value && !value.isBlank()) {
                return value;
            }
        }

        for (String key : List.of("token", "xToken", "X-Token")) {
            Object token = response.get(key);
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
        return Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS).toString();
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

    /** Serialize for debug logging — never throws. */
    private String safeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        }
        catch (Exception e) {
            return String.valueOf(value);
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

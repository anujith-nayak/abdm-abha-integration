package com.abha.abha_integration.service;

import com.abha.abha_integration.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
public class AbdmService {

    private final RestTemplate restTemplate;

    @Value("${abdm.client.id}")
    private String clientId;

    @Value("${abdm.client.secret}")
    private String clientSecret;

    public AbdmService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // STEP 1
    public String generateToken() {

        String url =
                "https://dev.abdm.gov.in/gateway/v0.5/sessions";

        Map<String,String> body =
                new HashMap<>();

        body.put("clientId", clientId);
        body.put("clientSecret", clientSecret);

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON);

        HttpEntity<Map<String,String>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        url,
                        request,
                        Map.class);

        return response.getBody()
                .get("accessToken")
                .toString();
    }

    // STEP 2
    public String getPublicKey(String token){

        String url =
                "https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate";

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(token);

        headers.add(
                "REQUEST-ID",
                UUID.randomUUID().toString());

        headers.add(
                "TIMESTAMP",
                Instant.now().toString());

        HttpEntity<String> entity =
                new HttpEntity<>(headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        Map.class);

        return response.getBody()
                .get("publicKey")
                .toString();
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

        String url =
                "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp";

        Map<String,Object> body =
                new HashMap<>();

        body.put("txnId","");
        body.put("scope",
                List.of("abha-enrol"));
        body.put("loginHint",
                "aadhaar");
        body.put("loginId",
                encrypted);
        body.put("otpSystem",
                "aadhaar");

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(token);

        headers.setContentType(
                MediaType.APPLICATION_JSON);

        headers.add(
                "REQUEST-ID",
                UUID.randomUUID().toString());

        headers.add(
                "TIMESTAMP",
                Instant.now().toString());

        HttpEntity<Map<String,Object>> entity =
                new HttpEntity<>(body,
                        headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        url,
                        entity,
                        String.class);

        return response.getBody();
    }
}
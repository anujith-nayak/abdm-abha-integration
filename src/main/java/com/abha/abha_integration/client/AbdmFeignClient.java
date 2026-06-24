package com.abha.abha_integration.client;

import com.abha.abha_integration.dto.CertificateResponse;
import com.abha.abha_integration.dto.OtpRequest;
import com.abha.abha_integration.dto.OtpResponse;
import com.abha.abha_integration.dto.TokenRequest;
import com.abha.abha_integration.dto.TokenResponse;
import com.abha.abha_integration.dto.VerifyOtpRequest;
import com.abha.abha_integration.dto.VerifyOtpResponse;
import java.net.URI;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "abdmFeignClient", url = "https://dev.abdm.gov.in")
public interface AbdmFeignClient {

    @PostMapping(
            value = "/gateway/v0.5/sessions",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    TokenResponse generateToken(
            URI baseUrl,
            @RequestBody TokenRequest request);

    @GetMapping("/abha/api/v3/profile/public/certificate")
    CertificateResponse getPublicKey(
            URI baseUrl,
            @RequestHeader("Authorization") String authorization,
            @RequestHeader("REQUEST-ID") String requestId,
            @RequestHeader("TIMESTAMP") String timestamp);

    @PostMapping(
            value = "/abha/api/v3/enrollment/request/otp",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    OtpResponse generateOtp(
            URI baseUrl,
            @RequestHeader("Authorization") String authorization,
            @RequestHeader("REQUEST-ID") String requestId,
            @RequestHeader("TIMESTAMP") String timestamp,
            @RequestBody OtpRequest request);

    @PostMapping(
            value = "/abha/api/v3/enrollment/enrol/byAadhaar",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    VerifyOtpResponse verifyOtp(
            URI baseUrl,
            @RequestHeader("Authorization") String authorization,
            @RequestHeader("REQUEST-ID") String requestId,
            @RequestHeader("TIMESTAMP") String timestamp,
            @RequestBody VerifyOtpRequest request);

    @GetMapping("/abha/api/v3/profile/account/abha-card")
    ResponseEntity<byte[]> downloadAbhaCard(
            URI baseUrl,
            @RequestHeader("Authorization") String authorization,
            @RequestHeader("X-Token") String xToken,
            @RequestHeader("REQUEST-ID") String requestId,
            @RequestHeader("TIMESTAMP") String timestamp);
}

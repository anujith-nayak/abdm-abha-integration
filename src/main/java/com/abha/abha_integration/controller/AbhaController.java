package com.abha.abha_integration.controller;

import com.abha.abha_integration.dto.AbhaAddressOtpRequest;
import com.abha.abha_integration.dto.AbhaAddressSearchRequest;
import com.abha.abha_integration.dto.AbhaAddressVerifyRequest;
import com.abha.abha_integration.dto.AbhaAddressVerifyResult;
import com.abha.abha_integration.dto.AadhaarRequest;
import com.abha.abha_integration.dto.PatientProfileDto;
import com.abha.abha_integration.dto.ResendOtpRequest;
import com.abha.abha_integration.dto.VerifyOtpInputRequest;
import com.abha.abha_integration.service.AbdmService;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AbhaController {

    private final AbdmService abdmService;

    public AbhaController(AbdmService abdmService) {
        this.abdmService = abdmService;
    }

    @GetMapping("/")
    public String home() {
        return "ABHA Integration Running";
    }

    @GetMapping("/api/abha/generate-otp")
    public ResponseEntity<String> generateOtp(
            @RequestParam String aadhaar) {

        try {
            return ResponseEntity.ok(
                    abdmService.generateOtp(aadhaar));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body("ERROR : " + e.getMessage());
        }
    }

    @PostMapping("/api/abha/generateOtp")
    public ResponseEntity<String> generateOtpPost(
            @RequestBody AadhaarRequest request) {

        try {
            return ResponseEntity.ok(
                    abdmService.generateOtp(request.getAadhaar()));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body("ERROR : " + e.getMessage());
        }
    }

    @PostMapping("/api/abha/verifyOtp")
    public ResponseEntity<String> verifyOtp(
            @RequestBody VerifyOtpInputRequest request) {

        try {
            return ResponseEntity.ok(
                    abdmService.verifyOtp(
                            request.getOtp(),
                            request.getTxnId(),
                            request.getMobile()));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body("ERROR : " + e.getMessage());
        }
    }

    @PostMapping("/api/abha/resendOtp")
    public ResponseEntity<String> resendOtp(
            @RequestBody ResendOtpRequest request) {

        try {
            return ResponseEntity.ok(
                    abdmService.generateOtp(
                            request.getAadhaar()));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body("ERROR : " + e.getMessage());
        }
    }

    @PostMapping("/api/abha/address/search")
    public ResponseEntity<?> searchAbhaAddress(
            @RequestBody AbhaAddressSearchRequest request) {

        try {
            return ResponseEntity.ok(
                    abdmService.searchAbhaAddress(request.getAbhaAddress()));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "ERROR : " + e.getMessage()));
        }
    }

    @PostMapping("/api/abha/address/request-otp")
    public ResponseEntity<?> requestAbhaAddressOtp(
            @RequestBody AbhaAddressOtpRequest request) {

        try {
            return ResponseEntity.ok(
                    abdmService.requestAbhaAddressOtp(
                            request.getAbhaAddress(),
                            request.getTxnId()));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "ERROR : " + e.getMessage()));
        }
    }

    /**
     * Verifies an ABHA Address OTP via the ABDM API and returns the verified
     * profile. Patient registration is a separate workflow and is NOT invoked here.
     */
    @PostMapping("/api/abha/address/verify")
    public ResponseEntity<?> verifyAbhaAddressOtp(
            @RequestBody AbhaAddressVerifyRequest request) {

        try {
            Map<String, Object> abdmResponse =
                    abdmService.verifyAbhaAddressOtp(
                            request.getAbhaAddress(),
                            request.getTxnId(),
                            request.getOtp());

            // ABDM returns HTTP 200 even when OTP verification fails, signalled by
            // authResult != "success". Surface the failure as HTTP 400 so the
            // frontend does not treat it as a successful verification.
            Object authResult = abdmResponse.get("authResult");
            if (!"success".equalsIgnoreCase(String.valueOf(authResult))) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "authResult", String.valueOf(authResult),
                                "message",    abdmResponse.getOrDefault(
                                                      "message",
                                                      "OTP verification failed.")));
            }

            PatientProfileDto abhaProfile =
                    abdmService.extractVerifiedProfile(
                            abdmResponse,
                            request.getAbhaAddress());

            return ResponseEntity.ok(
                    new AbhaAddressVerifyResult(
                            "ABHA Address verified successfully.",
                            abhaProfile,
                            abdmResponse));
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "ERROR : " + e.getMessage()));
        }
    }

    @GetMapping("/api/abha/download-card")
    public ResponseEntity<byte[]> downloadAbhaCard() {
        try {
            ResponseEntity<byte[]> response =
                    abdmService.downloadAbhaCard();
            MediaType contentType =
                    response.getHeaders().getContentType();
            MediaType downloadType = contentType != null
                    ? contentType
                    : MediaType.APPLICATION_OCTET_STREAM;
            String filename = downloadType.isCompatibleWith(MediaType.APPLICATION_PDF)
                    ? "ABHA_Card.pdf"
                    : "ABHA_Card.png";

            return ResponseEntity
                    .status(response.getStatusCode())
                    .contentType(downloadType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(response.getBody());
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("ERROR : " + e.getMessage())
                            .getBytes(StandardCharsets.UTF_8));
        }
    }
}

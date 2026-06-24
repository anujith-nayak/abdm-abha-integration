package com.abha.abha_integration.controller;

import com.abha.abha_integration.dto.AadhaarRequest;
import com.abha.abha_integration.dto.ResendOtpRequest;
import com.abha.abha_integration.dto.VerifyOtpInputRequest;
import com.abha.abha_integration.service.AbdmService;
import java.nio.charset.StandardCharsets;
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

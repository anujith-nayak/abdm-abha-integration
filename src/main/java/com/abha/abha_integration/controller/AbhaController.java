package com.abha.abha_integration.controller;

import com.abha.abha_integration.dto.AadhaarRequest;
import com.abha.abha_integration.dto.ResendOtpRequest;
import com.abha.abha_integration.dto.VerifyOtpInputRequest;
import com.abha.abha_integration.service.AbdmService;
import org.springframework.http.HttpStatus;
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
}

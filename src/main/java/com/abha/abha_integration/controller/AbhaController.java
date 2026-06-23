package com.abha.abha_integration.controller;

import com.abha.abha_integration.service.AbdmService;
import org.springframework.web.bind.annotation.GetMapping;
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
    public String generateOtp(
            @RequestParam String aadhaar) {

        try {
            return abdmService.generateOtp(aadhaar);
        }
        catch (Exception e) {
            e.printStackTrace();
            return "ERROR : " + e.getMessage();
        }
    }
}
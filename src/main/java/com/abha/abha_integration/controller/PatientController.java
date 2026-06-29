package com.abha.abha_integration.controller;

import com.abha.abha_integration.dto.PatientDto;
import com.abha.abha_integration.dto.PatientLinkResult;
import com.abha.abha_integration.dto.PatientRegistrationRequest;
import com.abha.abha_integration.repository.PatientRepository;
import com.abha.abha_integration.service.PatientLinkingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientLinkingService patientLinkingService;
    private final PatientRepository patientRepository;

    public PatientController(PatientLinkingService patientLinkingService,
                             PatientRepository patientRepository) {
        this.patientLinkingService = patientLinkingService;
        this.patientRepository = patientRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<PatientLinkResult> registerPatient(
            @RequestBody PatientRegistrationRequest request) {
        return ResponseEntity.ok(patientLinkingService.registerOrLink(request));
    }

    @PostMapping("/link")
    public ResponseEntity<PatientLinkResult> linkPatient(
            @RequestBody PatientRegistrationRequest request) {
        return ResponseEntity.ok(patientLinkingService.registerOrLink(request));
    }

    @PostMapping("/manual-review")
    public ResponseEntity<PatientLinkResult> sendForManualReview(
            @RequestBody PatientRegistrationRequest request) {
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(patientLinkingService.markForManualReview(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDto> getPatient(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(PatientDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/mrd/{mrdNumber}")
    public ResponseEntity<PatientDto> getPatientByMrd(
            @PathVariable String mrdNumber) {
        return patientRepository.findByMrdNumber(mrdNumber)
                .map(PatientDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

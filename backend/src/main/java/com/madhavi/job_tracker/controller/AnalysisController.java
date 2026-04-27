package com.madhavi.job_tracker.controller;

import com.madhavi.job_tracker.dto.AnalyzeRequest;
import com.madhavi.job_tracker.dto.AnalyzeResponse;
import com.madhavi.job_tracker.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeResponse> analyze(@Valid @RequestBody AnalyzeRequest request) {
        return ResponseEntity.ok(analysisService.analyze(request));
    }
}
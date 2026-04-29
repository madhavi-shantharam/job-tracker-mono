package com.madhavi.job_tracker.controller;

import com.madhavi.job_tracker.dto.PollSummaryResponse;
import com.madhavi.job_tracker.service.EmailImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email-import")
@RequiredArgsConstructor
public class EmailImportController {

    private final EmailImportService emailImportService;

    @PostMapping("/poll")
    public ResponseEntity<?> poll() {
        try {
            PollSummaryResponse summary = emailImportService.triggerPoll();
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", e.getMessage(),
                            "message", "Poll failed — check career-agent logs"
                    ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "email-import"
        ));
    }
}

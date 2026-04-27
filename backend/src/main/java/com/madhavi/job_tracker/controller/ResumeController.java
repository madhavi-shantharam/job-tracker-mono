package com.madhavi.job_tracker.controller;

import com.madhavi.job_tracker.dto.ResumeResponse;
import com.madhavi.job_tracker.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.tika.exception.TikaException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ResumeResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.uploadResume(file, name));
    }

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getAll() {
        return ResponseEntity.ok(resumeService.getAllResumes());
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<String> getContent(@PathVariable UUID id) throws IOException, TikaException {
        return ResponseEntity.ok(resumeService.getResumeContent(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        resumeService.deleteResume(id);
        return ResponseEntity.noContent().build();
    }
}

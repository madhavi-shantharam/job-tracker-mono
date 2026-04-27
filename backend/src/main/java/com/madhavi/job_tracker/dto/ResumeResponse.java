package com.madhavi.job_tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ResumeResponse {

    private UUID id;
    private String name;
    private String originalFileName;
    private LocalDateTime uploadedAt;
}

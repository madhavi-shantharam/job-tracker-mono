package com.madhavi.job_tracker.dto;

import com.madhavi.job_tracker.model.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {

    private Long id;
    private String company;
    private String role;
    private ApplicationStatus status;
    private String jobDescriptionText;
    private String notes;
    private LocalDate appliedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
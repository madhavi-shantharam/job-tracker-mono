package com.madhavi.job_tracker.dto;

import com.madhavi.job_tracker.model.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ApplicationRequest {

    @NotBlank(message = "Company name is required")
    private String company;

    @NotBlank(message = "Role is required")
    private String role;

    private ApplicationStatus status;

    private String jobDescriptionText;

    private String notes;

    private LocalDate appliedDate;
}
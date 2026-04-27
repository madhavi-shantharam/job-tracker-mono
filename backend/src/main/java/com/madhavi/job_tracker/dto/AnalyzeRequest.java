package com.madhavi.job_tracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnalyzeRequest {

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    @NotBlank(message = "Resume text is required")
    private String resumeText;
}
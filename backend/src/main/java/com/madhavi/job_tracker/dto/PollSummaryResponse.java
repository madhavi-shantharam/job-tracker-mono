package com.madhavi.job_tracker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PollSummaryResponse {
    private int fetched;
    private int filtered;

    @JsonProperty("new")
    private int newApplications;

    private int created;
    private int duplicate;
    private int skipped;
    private int errors;
    private String timestamp;
    private String message;
}

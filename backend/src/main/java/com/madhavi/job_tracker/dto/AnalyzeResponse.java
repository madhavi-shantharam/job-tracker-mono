package com.madhavi.job_tracker.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AnalyzeResponse {

    private int matchPercentage;
    private List<String> missingKeywords;
    private List<String> suggestedEdits;
    private String summary;
}
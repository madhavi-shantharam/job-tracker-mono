package com.madhavi.job_tracker.service;

import com.madhavi.job_tracker.dto.AnalyzeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnalysisServiceTest {

    private AnalysisService analysisService;

    @BeforeEach
    void setUp() {
        // We pass a dummy key — we won't make real API calls in unit tests
        analysisService = new AnalysisService("dummy-key");
    }

    @Test
    void parseResponse_shouldCorrectlyParseValidJson() throws Exception {
        // Use reflection to access the private method for direct testing
        String validJson = """
                {
                  "matchPercentage": 85,
                  "missingKeywords": ["CI/CD", "distributed systems"],
                  "suggestedEdits": ["Add CI/CD tools", "Mention distributed systems"],
                  "summary": "Strong match with minor gaps."
                }
                """;

        var method = AnalysisService.class
                .getDeclaredMethod("parseResponse", String.class);
        method.setAccessible(true);

        AnalyzeResponse response = (AnalyzeResponse) method.invoke(analysisService, validJson);

        assertThat(response.getMatchPercentage()).isEqualTo(85);
        assertThat(response.getMissingKeywords()).containsExactly("CI/CD", "distributed systems");
        assertThat(response.getSuggestedEdits()).hasSize(2);
        assertThat(response.getSummary()).isEqualTo("Strong match with minor gaps.");
    }

    @Test
    void parseResponse_shouldReturnFallback_whenJsonIsMalformed() throws Exception {
        String malformedJson = "this is not json at all";

        var method = AnalysisService.class
                .getDeclaredMethod("parseResponse", String.class);
        method.setAccessible(true);

        AnalyzeResponse response = (AnalyzeResponse) method.invoke(analysisService, malformedJson);

        assertThat(response.getMatchPercentage()).isEqualTo(0);
        assertThat(response.getSummary()).contains("Analysis failed");
    }

    @Test
    void parseResponse_shouldHandleMarkdownFences_gracefully() throws Exception {
        String wrappedJson = """
```json
                {
                  "matchPercentage": 70,
                  "missingKeywords": ["Kubernetes"],
                  "suggestedEdits": ["Add Kubernetes experience"],
                  "summary": "Good match overall."
                }
```
                """;

        var method = AnalysisService.class
                .getDeclaredMethod("parseResponse", String.class);
        method.setAccessible(true);

        AnalyzeResponse response = (AnalyzeResponse) method.invoke(analysisService, wrappedJson);

        assertThat(response.getMatchPercentage()).isEqualTo(70);
        assertThat(response.getMissingKeywords()).containsExactly("Kubernetes");
    }
}
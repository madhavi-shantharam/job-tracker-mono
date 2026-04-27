package com.madhavi.job_tracker.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.madhavi.job_tracker.dto.AnalyzeRequest;
import com.madhavi.job_tracker.dto.AnalyzeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AnalysisService {

    private final AnthropicClient anthropic;
    private final ObjectMapper objectMapper;

    public AnalysisService(@Value("${anthropic.api.key}") String apiKey) {
        // In test environment the key is a placeholder — client is mocked in tests
        if (apiKey != null && !apiKey.startsWith("test-")) {
            this.anthropic = AnthropicOkHttpClient.builder()
                    .apiKey(apiKey)
                    .build();
        } else {
            this.anthropic = null; // Will be mocked in tests
        }
        this.objectMapper = new ObjectMapper();
    }

    public AnalyzeResponse analyze(AnalyzeRequest request) {
        if (anthropic == null) {
            throw new IllegalStateException("Anthropic client not configured — check API key");
        }

        String prompt = buildPrompt(request.getJobDescription(), request.getResumeText());

        log.info("Calling Claude API for resume analysis...");

        Message message = anthropic.messages().create(
                MessageCreateParams.builder()
                        .model(Model.CLAUDE_SONNET_4_5)
                        .maxTokens(1024L)
                        .addUserMessage(prompt)
                        .build()
        );

        String rawResponse = message.content().get(0).text().get().text();
        log.info("Claude response received");

        return parseResponse(rawResponse);
    }

    private String buildPrompt(String jobDescription, String resumeText) {
        return """
                You are a technical recruiter and resume expert.
                
                Analyze the following resume against the job description and respond ONLY with a JSON object — no explanation, no markdown, no code fences.
                
                The JSON must have exactly these fields:
                {
                  "matchPercentage": <integer 0-100>,
                  "missingKeywords": [<list of strings>],
                  "suggestedEdits": [<list of strings>],
                  "summary": "<one sentence overall assessment>"
                }
                
                JOB DESCRIPTION:
                %s
                
                RESUME:
                %s
                """.formatted(jobDescription, resumeText);
    }

    private AnalyzeResponse parseResponse(String raw) {
        try {
            String cleaned = raw
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            JsonNode node = objectMapper.readTree(cleaned);

            int matchPercentage = node.get("matchPercentage").asInt();

            List<String> missingKeywords = new ArrayList<>();
            node.get("missingKeywords").forEach(k -> missingKeywords.add(k.asText()));

            List<String> suggestedEdits = new ArrayList<>();
            node.get("suggestedEdits").forEach(e -> suggestedEdits.add(e.asText()));

            String summary = node.get("summary").asText();

            return AnalyzeResponse.builder()
                    .matchPercentage(matchPercentage)
                    .missingKeywords(missingKeywords)
                    .suggestedEdits(suggestedEdits)
                    .summary(summary)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Claude response: {}", raw, e);
            return AnalyzeResponse.builder()
                    .matchPercentage(0)
                    .missingKeywords(List.of("Parse error — check logs"))
                    .suggestedEdits(List.of("Claude response could not be parsed"))
                    .summary("Analysis failed — please retry")
                    .build();
        }
    }
}
package com.madhavi.job_tracker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.madhavi.job_tracker.dto.PollSummaryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class EmailImportService {

    @Value("${career.agent.path:../career-agent}")
    private String careerAgentPath;

    @Value("${career.agent.venv.python:../career-agent/venv/bin/python}")
    private String pythonPath;

    public PollSummaryResponse triggerPoll() {
        List<String> command = List.of(pythonPath, "scripts/test_integration.py");
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new File(careerAgentPath));
        pb.redirectErrorStream(true);

        log.info("Starting career-agent poller: {} in {}", command, careerAgentPath);

        Process process;
        try {
            process = pb.start();
        } catch (IOException e) {
            throw new RuntimeException("Failed to start poller: " + e.getMessage());
        }

        boolean finished;
        try {
            finished = process.waitFor(120, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Poll interrupted");
        }

        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Poll timed out after 120 seconds");
        }

        String output;
        try {
            output = new String(process.getInputStream().readAllBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read poller output: " + e.getMessage());
        }

        int exitCode = process.exitValue();
        log.info("Poller exited with code {}", exitCode);

        if (exitCode != 0) {
            throw new RuntimeException("Poller failed (exit " + exitCode + "): " + output);
        }

        String lastLine = Arrays.stream(output.split("\n"))
                .map(String::trim)
                .filter(l -> l.startsWith("{"))
                .reduce((first, second) -> second)
                .orElseThrow(() -> new RuntimeException(
                        "No JSON summary found in output: " + output));

        ObjectMapper mapper = new ObjectMapper();
        PollSummaryResponse summary;
        try {
            summary = mapper.readValue(lastLine, PollSummaryResponse.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse poll output: " + output);
        }

        summary.setMessage("Poll completed successfully");
        return summary;
    }
}

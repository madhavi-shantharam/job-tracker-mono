package com.madhavi.job_tracker.controller;

import com.madhavi.job_tracker.dto.PollSummaryResponse;
import com.madhavi.job_tracker.service.EmailImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmailImportController.class)
class EmailImportControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    EmailImportService emailImportService;

    @Test
    void poll_returns200_onSuccess() throws Exception {
        PollSummaryResponse response = new PollSummaryResponse(
                5, 3, 0, 2, 1, 0, 0, "2026-04-28T10:00:00", "Poll completed successfully"
        );
        when(emailImportService.triggerPoll()).thenReturn(response);

        mockMvc.perform(post("/api/email-import/poll"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(2));
    }

    @Test
    void poll_returns503_whenPollerFails() throws Exception {
        when(emailImportService.triggerPoll())
                .thenThrow(new RuntimeException("Poller failed"));

        mockMvc.perform(post("/api/email-import/poll"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void health_returns200_withStatusOk() throws Exception {
        mockMvc.perform(get("/api/email-import/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }
}

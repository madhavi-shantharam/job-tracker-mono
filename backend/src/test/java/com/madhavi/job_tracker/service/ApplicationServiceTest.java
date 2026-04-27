package com.madhavi.job_tracker.service;

import com.madhavi.job_tracker.dto.ApplicationRequest;
import com.madhavi.job_tracker.dto.ApplicationResponse;
import com.madhavi.job_tracker.exception.ResourceNotFoundException;
import com.madhavi.job_tracker.model.Application;
import com.madhavi.job_tracker.model.ApplicationStatus;
import com.madhavi.job_tracker.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository repository;

    @InjectMocks
    private ApplicationService service;

    private Application savedApplication;
    private ApplicationRequest request;

    @BeforeEach
    void setUp() {
        request = new ApplicationRequest();
        request.setCompany("Expedia");
        request.setRole("SDE II");
        request.setStatus(ApplicationStatus.APPLIED);
        request.setNotes("Applied via LinkedIn");
        request.setAppliedDate(LocalDate.of(2026, 4, 6));

        savedApplication = Application.builder()
                .id(1L)
                .company("Expedia")
                .role("SDE II")
                .status(ApplicationStatus.APPLIED)
                .notes("Applied via LinkedIn")
                .appliedDate(LocalDate.of(2026, 4, 6))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // --- CREATE ---

    @Test
    void create_shouldReturnSavedApplication() {
        when(repository.save(any(Application.class))).thenReturn(savedApplication);

        ApplicationResponse response = service.create(request);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getCompany()).isEqualTo("Expedia");
        assertThat(response.getRole()).isEqualTo("SDE II");
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);

        verify(repository, times(1)).save(any(Application.class));
    }

    @Test
    void create_shouldDefaultStatusToApplied_whenStatusNotProvided() {
        request.setStatus(null);
        when(repository.save(any(Application.class))).thenReturn(savedApplication);

        ApplicationResponse response = service.create(request);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
    }

    // --- GET ALL ---

    @Test
    void getAll_shouldReturnListOfApplications() {
        when(repository.findAll()).thenReturn(List.of(savedApplication));

        List<ApplicationResponse> responses = service.getAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getCompany()).isEqualTo("Expedia");
    }

    @Test
    void getAll_shouldReturnEmptyList_whenNoApplicationsExist() {
        when(repository.findAll()).thenReturn(List.of());

        List<ApplicationResponse> responses = service.getAll();

        assertThat(responses).isEmpty();
    }

    // --- GET BY ID ---

    @Test
    void getById_shouldReturnApplication_whenFound() {
        when(repository.findById(1L)).thenReturn(Optional.of(savedApplication));

        ApplicationResponse response = service.getById(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getCompany()).isEqualTo("Expedia");
    }

    @Test
    void getById_shouldThrowResourceNotFoundException_whenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // --- UPDATE ---

    @Test
    void update_shouldUpdateFieldsAndReturnResponse() {
        ApplicationRequest updateRequest = new ApplicationRequest();
        updateRequest.setCompany("Expedia");
        updateRequest.setRole("SDE II");
        updateRequest.setStatus(ApplicationStatus.PHONE_SCREEN);
        updateRequest.setNotes("Recruiter reached out");
        updateRequest.setAppliedDate(LocalDate.of(2026, 4, 6));

        Application updatedApp = Application.builder()
                .id(1L)
                .company("Expedia")
                .role("SDE II")
                .status(ApplicationStatus.PHONE_SCREEN)
                .notes("Recruiter reached out")
                .appliedDate(LocalDate.of(2026, 4, 6))
                .createdAt(savedApplication.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(savedApplication));
        when(repository.save(any(Application.class))).thenReturn(updatedApp);

        ApplicationResponse response = service.update(1L, updateRequest);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.PHONE_SCREEN);
        assertThat(response.getNotes()).isEqualTo("Recruiter reached out");
    }

    @Test
    void update_shouldThrowResourceNotFoundException_whenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // --- DELETE ---

    @Test
    void delete_shouldCallRepositoryDelete_whenFound() {
        when(repository.existsById(1L)).thenReturn(true);

        service.delete(1L);

        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void delete_shouldThrowResourceNotFoundException_whenNotFound() {
        when(repository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");

        verify(repository, never()).deleteById(any());
    }
}
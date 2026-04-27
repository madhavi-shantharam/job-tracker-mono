package com.madhavi.job_tracker.service;

import com.madhavi.job_tracker.dto.ApplicationRequest;
import com.madhavi.job_tracker.dto.ApplicationResponse;
import com.madhavi.job_tracker.exception.ResourceNotFoundException;
import com.madhavi.job_tracker.model.Application;
import com.madhavi.job_tracker.model.ApplicationStatus;
import com.madhavi.job_tracker.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationResponse create(ApplicationRequest request) {
        Application app = Application.builder()
                .company(request.getCompany())
                .role(request.getRole())
                .status(request.getStatus() != null ? request.getStatus() : ApplicationStatus.APPLIED)
                .jobDescriptionText(request.getJobDescriptionText())
                .notes(request.getNotes())
                .appliedDate(request.getAppliedDate())
                .build();

        return toResponse(repository.save(app));
    }

    public List<ApplicationResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ApplicationResponse getById(Long id) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found with id: " + id));
        return toResponse(app);
    }

    public ApplicationResponse update(Long id, ApplicationRequest request) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found with id: " + id));

        app.setCompany(request.getCompany());
        app.setRole(request.getRole());
        if (request.getStatus() != null) {
            app.setStatus(request.getStatus());
        }
        app.setJobDescriptionText(request.getJobDescriptionText());
        app.setNotes(request.getNotes());
        app.setAppliedDate(request.getAppliedDate());

        return toResponse(repository.save(app));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Application not found with id: " + id);
        }
        repository.deleteById(id);
    }

    // --- private mapper ---
    private ApplicationResponse toResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .company(app.getCompany())
                .role(app.getRole())
                .status(app.getStatus())
                .jobDescriptionText(app.getJobDescriptionText())
                .notes(app.getNotes())
                .appliedDate(app.getAppliedDate())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
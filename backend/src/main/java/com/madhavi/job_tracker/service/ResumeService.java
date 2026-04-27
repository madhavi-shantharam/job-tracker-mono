package com.madhavi.job_tracker.service;

import com.madhavi.job_tracker.dto.ResumeResponse;
import com.madhavi.job_tracker.exception.ResumeLimitExceededException;
import com.madhavi.job_tracker.exception.ResumeNotFoundException;
import com.madhavi.job_tracker.model.Resume;
import com.madhavi.job_tracker.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final int MAX_RESUMES = 3;

    private final ResumeRepository resumeRepository;
    private final S3Service s3Service;

    public ResumeResponse uploadResume(MultipartFile file, String name) throws IOException {
        if (resumeRepository.count() >= MAX_RESUMES) {
            throw new ResumeLimitExceededException(
                    "Resume limit reached. You may only upload up to " + MAX_RESUMES + " resumes.");
        }

        String s3Key = "resumes/" + UUID.randomUUID() + "/" + file.getOriginalFilename();

        s3Service.uploadFile(file, s3Key);

        Resume resume = Resume.builder()
                .name(name != null && !name.isBlank() ? name : file.getOriginalFilename())
                .originalFileName(file.getOriginalFilename())
                .s3Key(s3Key)
                .build();

        Resume saved = resumeRepository.save(resume);
        return toResponse(saved);
    }

    public List<ResumeResponse> getAllResumes() {
        return resumeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public String getResumeContent(UUID id) throws IOException, TikaException {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResumeNotFoundException("Resume not found with id: " + id));

        byte[] fileBytes = s3Service.getFileBytes(resume.getS3Key());

        Tika tika = new Tika();
        return tika.parseToString(new java.io.ByteArrayInputStream(fileBytes));
    }

    public void deleteResume(UUID id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResumeNotFoundException("Resume not found with id: " + id));

        s3Service.deleteFile(resume.getS3Key());
        resumeRepository.delete(resume);
    }

    private ResumeResponse toResponse(Resume resume) {
        return ResumeResponse.builder()
                .id(resume.getId())
                .name(resume.getName())
                .originalFileName(resume.getOriginalFileName())
                .uploadedAt(resume.getUploadedAt())
                .build();
    }
}

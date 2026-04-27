package com.madhavi.job_tracker.repository;

import com.madhavi.job_tracker.model.Application;
import com.madhavi.job_tracker.model.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByStatus(ApplicationStatus status);

    List<Application> findByCompanyContainingIgnoreCase(String company);
}
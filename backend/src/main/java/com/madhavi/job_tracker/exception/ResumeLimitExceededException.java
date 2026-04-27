package com.madhavi.job_tracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ResumeLimitExceededException extends RuntimeException {

    public ResumeLimitExceededException(String message) {
        super(message);
    }
}

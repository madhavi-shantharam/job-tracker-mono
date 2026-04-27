package com.madhavi.job_tracker;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.services.s3.S3Client;

@ActiveProfiles("test")
@SpringBootTest
class JobTrackerApplicationTests {

	@MockitoBean
	S3Client s3Client;

	@Test
	void contextLoads() {
		// Verifies the Spring context starts successfully
		// Uses H2 in-memory DB via src/test/resources/application.properties
		// S3Client is mocked — no AWS credentials needed in tests
	}

}

package com.testgen.controller;

import com.testgen.model.ApiModels;
import com.testgen.service.TestCaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestCaseController {

    private final TestCaseService testCaseService;

    public TestCaseController(TestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateTestCases(@RequestBody ApiModels.GenerateRequest request) {
        try {
            if (request.getJiraStoryId() == null || request.getJiraStoryId().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(new ApiModels.ErrorResponse("Validation Error", "Jira Story ID is required", 400));
            }

            ApiModels.GenerateResponse response = testCaseService.generate(request);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            String message = e.getMessage();
            int status = 500;
            if (message != null && (message.contains("not found") || message.contains("404"))) status = 404;
            if (message != null && (message.contains("authentication") || message.contains("401"))) status = 401;
            return ResponseEntity.status(status)
                    .body(new ApiModels.ErrorResponse("Error", message, status));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiModels.ErrorResponse("Server Error",
                            "An unexpected error occurred: " + e.getMessage(), 500));
        }
    }
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Jira Test Case Generator",
                "version", "1.0.0"
        ));
    }
}

package com.testgen.model;

import java.util.List;
import java.util.Map;

public class ApiModels {

    // Frontend only sends the story ID now
    public static class GenerateRequest {
        private String jiraStoryId;
        private String additionalContext;
        private List<String> confluenceUrls;

        public String getJiraStoryId() { return jiraStoryId; }
        public void setJiraStoryId(String jiraStoryId) { this.jiraStoryId = jiraStoryId; }
        public String getAdditionalContext() { return additionalContext; }
        public void setAdditionalContext(String additionalContext) { this.additionalContext = additionalContext; }
        public List<String> getConfluenceUrls() { return confluenceUrls; }
        public void setConfluenceUrls(List<String> confluenceUrls) { this.confluenceUrls = confluenceUrls; }
    }

    public static class StoryInfo {
        private String storyId;
        private String summary;
        private String description;
        private String acceptanceCriteria;
        private String status;
        private String priority;
        private String type;
        private List<Map<String, Object>> confluencePages;

        public String getStoryId() { return storyId; }
        public void setStoryId(String storyId) { this.storyId = storyId; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getAcceptanceCriteria() { return acceptanceCriteria; }
        public void setAcceptanceCriteria(String ac) { this.acceptanceCriteria = ac; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<Map<String, Object>> getConfluencePages() { return confluencePages; }
        public void setConfluencePages(List<Map<String, Object>> pages) { this.confluencePages = pages; }
    }

    public static class GenerateResponse {
        private StoryInfo storyInfo;
        private List<TestCase> testCases;
        private String summary;
        private int totalTestCases;

        public StoryInfo getStoryInfo() { return storyInfo; }
        public void setStoryInfo(StoryInfo storyInfo) { this.storyInfo = storyInfo; }
        public List<TestCase> getTestCases() { return testCases; }
        public void setTestCases(List<TestCase> testCases) { this.testCases = testCases; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public int getTotalTestCases() { return totalTestCases; }
        public void setTotalTestCases(int totalTestCases) { this.totalTestCases = totalTestCases; }
    }

    public static class ErrorResponse {
        private String error;
        private String message;
        private int status;

        public ErrorResponse(String error, String message, int status) {
            this.error = error;
            this.message = message;
            this.status = status;
        }

        public String getError() { return error; }
        public String getMessage() { return message; }
        public int getStatus() { return status; }
    }
}

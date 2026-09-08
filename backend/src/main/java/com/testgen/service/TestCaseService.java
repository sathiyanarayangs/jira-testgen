package com.testgen.service;

import com.testgen.model.ApiModels;
import com.testgen.model.JiraStory;
import com.testgen.model.TestCase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TestCaseService {

    private final JiraService jiraService;
    private final ConfluenceService confluenceService;
    private final GeminiService geminiService;

    @Value("${jira.base-url}")
    private String jiraBaseUrl;

    @Value("${jira.email}")
    private String jiraEmail;

    @Value("${jira.api-token}")
    private String jiraToken;

    @Value("${confluence.base-url}")
    private String confluenceBaseUrl;

    @Value("${confluence.email}")
    private String confluenceEmail;

    @Value("${confluence.api-token}")
    private String confluenceToken;

    @Value("${confluence.space-keys:}")
    private String confluenceSpaceKeysRaw;

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    public TestCaseService(JiraService jiraService,
                           ConfluenceService confluenceService,
                           GeminiService geminiService) {
        this.jiraService = jiraService;
        this.confluenceService = confluenceService;
        this.geminiService = geminiService;
    }

    public ApiModels.GenerateResponse generate(ApiModels.GenerateRequest req) throws Exception {
        // 1. Fetch Jira story using backend-configured credentials
        JiraStory story = jiraService.fetchStory(jiraBaseUrl, jiraEmail, jiraToken, req.getJiraStoryId());

        // 2. Extract story fields
        String description = jiraService.extractDescription(story);
        String acceptanceCriteria = jiraService.extractAcceptanceCriteria(story);
        String summary = story.getFields() != null ? story.getFields().getSummary() : req.getJiraStoryId();
        String status = story.getFields() != null && story.getFields().getStatus() != null
                ? (String) story.getFields().getStatus().get("name") : "Unknown";
        String priority = story.getFields() != null && story.getFields().getPriority() != null
                ? (String) story.getFields().getPriority().get("name") : "Medium";
        String type = story.getFields() != null && story.getFields().getIssuetype() != null
                ? (String) story.getFields().getIssuetype().get("name") : "Story";

        // 3. Parse space keys
        List<String> spaceKeys = new ArrayList<>();
        if (confluenceSpaceKeysRaw != null && !confluenceSpaceKeysRaw.isBlank()) {
            for (String k : confluenceSpaceKeysRaw.split(",")) {
                String trimmed = k.trim();
                if (!trimmed.isEmpty()) spaceKeys.add(trimmed);
            }
        }

        String effConfluenceUrl = (confluenceBaseUrl == null || confluenceBaseUrl.isBlank() || confluenceBaseUrl.contains("your-domain"))
                ? jiraBaseUrl : confluenceBaseUrl;
        String effConfluenceEmail = (confluenceEmail == null || confluenceEmail.isBlank())
                ? jiraEmail : confluenceEmail;
        String effConfluenceToken = (confluenceToken == null || confluenceToken.isBlank())
                ? jiraToken : confluenceToken;

        boolean confluenceConfigured = !effConfluenceUrl.contains("your-domain");

        // 4. Fetch Confluence pages
        List<Map<String, Object>> confluencePages = new ArrayList<>();

        if (req.getConfluenceUrls() != null && !req.getConfluenceUrls().isEmpty()) {
            // User provided direct URLs — fetch each one
            for (String pageUrl : req.getConfluenceUrls()) {
                if (pageUrl == null || pageUrl.isBlank()) continue;
                try {
                    Map<String, Object> page = confluenceService.fetchPageByUrl(
                            effConfluenceEmail, effConfluenceToken, pageUrl.trim());
                    if (page != null) confluencePages.add(page);
                } catch (Exception e) {
                    System.out.println("Failed to fetch Confluence URL: " + pageUrl + " — " + e.getMessage());
                }
            }
        } else if (confluenceConfigured) {
            // Fall back to keyword search
            try {
                confluencePages = confluenceService.searchRelatedPages(
                        effConfluenceUrl, effConfluenceEmail, effConfluenceToken,
                        req.getJiraStoryId(), summary, spaceKeys);
            } catch (Exception e) {
                System.out.println("Confluence search failed: " + e.getMessage());
            }
        }

        // 5. Build story info
        ApiModels.StoryInfo storyInfo = new ApiModels.StoryInfo();
        storyInfo.setStoryId(req.getJiraStoryId());
        storyInfo.setSummary(summary);
        storyInfo.setDescription(description);
        storyInfo.setAcceptanceCriteria(acceptanceCriteria);
        storyInfo.setStatus(status);
        storyInfo.setPriority(priority);
        storyInfo.setType(type);
        storyInfo.setConfluencePages(confluencePages);

        if (req.getAdditionalContext() != null && !req.getAdditionalContext().isBlank()) {
            storyInfo.setDescription(storyInfo.getDescription()
                    + "\n\nAdditional Context:\n" + req.getAdditionalContext());
        }

        // 6. Generate test cases
        List<TestCase> testCases = geminiService.generateTestCases(geminiApiKey, storyInfo);

        // 7. Build response
        ApiModels.GenerateResponse response = new ApiModels.GenerateResponse();
        response.setStoryInfo(storyInfo);
        response.setTestCases(testCases);
        response.setTotalTestCases(testCases.size());
        response.setSummary(String.format(
                "Generated %d test cases for %s using Jira data%s.",
                testCases.size(), req.getJiraStoryId(),
                confluencePages.isEmpty() ? "" : " + " + confluencePages.size() + " Confluence pages"));

        return response;
    }
}

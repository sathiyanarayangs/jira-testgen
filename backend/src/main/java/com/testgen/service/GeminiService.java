package com.testgen.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.model.ApiModels;
import com.testgen.model.TestCase;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class GeminiService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    public GeminiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(30))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public List<TestCase> generateTestCases(String apiKey, ApiModels.StoryInfo storyInfo) throws Exception {
        String prompt = buildPrompt(storyInfo);
        String requestBody = buildGeminiRequest(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(java.time.Duration.ofSeconds(120))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 400) {
            throw new RuntimeException("Gemini API bad request. Check your API key.");
        }
        if (response.statusCode() == 401 || response.statusCode() == 403) {
            throw new RuntimeException("Gemini API authentication failed. Please check your API key.");
        }
        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API error: HTTP " + response.statusCode());
        }

        return parseTestCasesFromResponse(response.body());
    }

    private String buildPrompt(ApiModels.StoryInfo storyInfo) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a senior QA engineer. Generate comprehensive test cases for the following Jira user story.\n\n");

        sb.append("## Jira Story: ").append(storyInfo.getStoryId()).append("\n");
        sb.append("**Summary:** ").append(storyInfo.getSummary()).append("\n");
        sb.append("**Type:** ").append(storyInfo.getType()).append("\n");
        sb.append("**Priority:** ").append(storyInfo.getPriority()).append("\n");
        sb.append("**Status:** ").append(storyInfo.getStatus()).append("\n\n");

        if (storyInfo.getDescription() != null && !storyInfo.getDescription().isBlank()) {
            sb.append("**Description:**\n").append(storyInfo.getDescription()).append("\n\n");
        }

        if (storyInfo.getAcceptanceCriteria() != null && !storyInfo.getAcceptanceCriteria().isBlank()) {
            sb.append("**Acceptance Criteria:**\n").append(storyInfo.getAcceptanceCriteria()).append("\n\n");
        }

        if (storyInfo.getConfluencePages() != null && !storyInfo.getConfluencePages().isEmpty()) {
            sb.append("## Related Confluence Documentation\n");
            for (Map<String, Object> page : storyInfo.getConfluencePages()) {
                sb.append("### ").append(page.get("title")).append("\n");
                sb.append("URL: ").append(page.get("url")).append("\n");
                Object content = page.get("content");
                if (content != null && !content.toString().isBlank()) {
                    sb.append(content.toString(), 0, Math.min(content.toString().length(), 1500));
                    sb.append("\n");
                }
                sb.append("\n");
            }
        }

        sb.append("""

                ## Instructions
                Generate EXACTLY 15 test cases (no more). Keep each test case concise.
                Each step should be one short sentence. Expected result should be one sentence.

                Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
                Each test case must have this exact structure:
                {
                  "id": "TC-001",
                  "title": "Short descriptive title under 80 chars",
                  "category": "Functional|Integration|Security|Performance|UI",
                  "priority": "Critical|High|Medium|Low",
                  "type": "Positive|Negative|Edge Case|Security|Performance",
                  "preconditions": "One sentence max",
                  "steps": ["Step 1", "Step 2", "Step 3"],
                  "expectedResult": "One sentence describing expected outcome",
                  "tags": ["tag1", "tag2"]
                }
                """);

        return sb.toString();
    }

    private String buildGeminiRequest(String prompt) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();

        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new LinkedHashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", prompt);
        parts.add(part);
        content.put("parts", parts);
        contents.add(content);
        request.put("contents", contents);

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 65536);
        generationConfig.put("responseMimeType", "application/json");
        request.put("generationConfig", generationConfig);

        return objectMapper.writeValueAsString(request);
    }

    private String recoverTruncatedJson(String text) {
        // Find the last complete object by finding last '}' before truncation
        int lastComplete = text.lastIndexOf("},");
        if (lastComplete == -1) lastComplete = text.lastIndexOf("}");
        if (lastComplete != -1) {
            text = text.substring(0, lastComplete + 1) + "]";
            System.out.println("Recovered truncated JSON — kept content up to char " + lastComplete);
        }
        return text;
    }

    private List<TestCase> parseTestCasesFromResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.get("candidates");

        if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("No response from Gemini AI.");
        }

        String text = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText("");

        // Clean up potential markdown artifacts
        text = text.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        text = text.trim();

        // Check for truncation finish reason
        String finishReason = candidates.get(0).path("finishReason").asText("");
        if ("MAX_TOKENS".equals(finishReason)) {
            System.out.println("WARNING: Gemini response truncated (MAX_TOKENS). Attempting recovery...");
            text = recoverTruncatedJson(text);
        }

        JsonNode array;
        try {
            array = objectMapper.readTree(text);
        } catch (Exception e) {
            System.out.println("JSON parse failed, attempting truncation recovery: " + e.getMessage());
            text = recoverTruncatedJson(text);
            array = objectMapper.readTree(text);
        }

        List<TestCase> testCases = new ArrayList<>();
        if (array.isArray()) {
            for (JsonNode node : array) {
                TestCase tc = new TestCase();
                tc.setId(node.path("id").asText("TC-" + (testCases.size() + 1)));
                tc.setTitle(node.path("title").asText(""));
                tc.setCategory(node.path("category").asText("Functional"));
                tc.setPriority(node.path("priority").asText("Medium"));
                tc.setType(node.path("type").asText("Positive"));
                tc.setPreconditions(node.path("preconditions").asText(""));
                tc.setExpectedResult(node.path("expectedResult").asText(""));

                List<String> steps = new ArrayList<>();
                JsonNode stepsNode = node.get("steps");
                if (stepsNode != null && stepsNode.isArray()) {
                    for (JsonNode s : stepsNode) steps.add(s.asText());
                }
                tc.setSteps(steps);

                List<String> tags = new ArrayList<>();
                JsonNode tagsNode = node.get("tags");
                if (tagsNode != null && tagsNode.isArray()) {
                    for (JsonNode t : tagsNode) tags.add(t.asText());
                }
                tc.setTags(tags);

                testCases.add(tc);
            }
        }

        return testCases;
    }
}
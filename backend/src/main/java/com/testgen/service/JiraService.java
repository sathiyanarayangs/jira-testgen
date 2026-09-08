package com.testgen.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.model.JiraStory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class JiraService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public JiraService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    public JiraStory fetchStory(String baseUrl, String email, String apiToken, String storyId) throws Exception {
        String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());
        String url = baseUrl.replaceAll("/$", "") + "/rest/api/3/issue/" + storyId.trim();

        System.out.println("=== JIRA DEBUG ===");
        System.out.println("URL: " + url);
        System.out.println("Email: " + email);
        System.out.println("Token length: " + (apiToken != null ? apiToken.length() : 0));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + auth)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("HTTP Status: " + response.statusCode());
        System.out.println("Response (first 500 chars): " + response.body().substring(0, Math.min(500, response.body().length())));
        System.out.println("==================");

        if (response.statusCode() == 401) {
            throw new RuntimeException("Jira authentication failed. Please check your email and API token.");
        }
        if (response.statusCode() == 403) {
            throw new RuntimeException("Jira access forbidden. Your account may not have permission to view this issue.");
        }
        if (response.statusCode() == 404) {
            // Parse Jira error message for more detail
            String body = response.body();
            String detail = "";
            try {
                JsonNode node = objectMapper.readTree(body);
                JsonNode errors = node.get("errorMessages");
                if (errors != null && errors.isArray() && errors.size() > 0) {
                    detail = " — " + errors.get(0).asText();
                }
            } catch (Exception ignored) {}
            throw new RuntimeException("Jira story '" + storyId + "' not found" + detail +
                    ". Check the story ID and that your token has access to this project.");
        }
        if (response.statusCode() != 200) {
            throw new RuntimeException("Jira API error: HTTP " + response.statusCode() + " — " + response.body());
        }

        try {
            return objectMapper.readValue(response.body(), JiraStory.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Jira response: " + e.getMessage());
        }
    }

    public String extractDescription(JiraStory story) {
        if (story.getFields() == null) return "";
        JiraStory.Description desc = story.getFields().getDescription();
        if (desc == null) return "";

        StringBuilder sb = new StringBuilder();
        if (desc.getContent() != null) {
            extractTextFromContent(desc.getContent(), sb);
        }
        return sb.toString().trim();
    }

    public String extractAcceptanceCriteria(JiraStory story) {
        if (story.getFields() == null) return "";

        // Try common Jira acceptance criteria custom fields
        Object ac = story.getFields().getAcceptanceCriteria();
        if (ac == null) ac = story.getFields().getAcceptanceCriteriaAlt();
        if (ac == null) return "";

        if (ac instanceof String) return (String) ac;

        // If it's an Atlassian Document Format object
        try {
            String json = objectMapper.writeValueAsString(ac);
            JsonNode node = objectMapper.readTree(json);
            if (node.has("content")) {
                StringBuilder sb = new StringBuilder();
                extractTextFromJsonNode(node.get("content"), sb);
                return sb.toString().trim();
            }
        } catch (Exception ignored) {}

        return ac.toString();
    }

    @SuppressWarnings("unchecked")
    private void extractTextFromContent(List<Map<String, Object>> content, StringBuilder sb) {
        if (content == null) return;
        for (Map<String, Object> node : content) {
            String type = (String) node.get("type");
            if ("text".equals(type)) {
                Object text = node.get("text");
                if (text != null) sb.append(text);
            } else if ("hardBreak".equals(type) || "paragraph".equals(type)) {
                sb.append("\n");
            } else if ("bulletList".equals(type) || "orderedList".equals(type)) {
                sb.append("\n");
            } else if ("listItem".equals(type)) {
                sb.append("• ");
            }
            Object children = node.get("content");
            if (children instanceof List) {
                extractTextFromContent((List<Map<String, Object>>) children, sb);
            }
            if ("paragraph".equals(type) || "heading".equals(type)) {
                sb.append("\n");
            }
        }
    }

    private void extractTextFromJsonNode(JsonNode contentArray, StringBuilder sb) {
        if (contentArray == null || !contentArray.isArray()) return;
        for (JsonNode node : contentArray) {
            String type = node.has("type") ? node.get("type").asText() : "";
            if ("text".equals(type) && node.has("text")) {
                sb.append(node.get("text").asText());
            }
            if (node.has("content")) {
                extractTextFromJsonNode(node.get("content"), sb);
            }
            if ("paragraph".equals(type) || "bulletList".equals(type)) {
                sb.append("\n");
            }
        }
    }

    public String fetchLinkedConfluencePages(String baseUrl, String email, String apiToken, String storyId) {
        // Search Confluence for pages mentioning this story
        try {
            String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());
            String cql = "text+%7E+%22" + storyId + "%22&limit=5";
            String url = baseUrl.replaceAll("/$", "") + "/wiki/rest/api/content/search?cql=" + cql + "&expand=body.view";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Basic " + auth)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return response.body();
            }
        } catch (Exception ignored) {}
        return null;
    }
}
package com.testgen.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ConfluenceService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ConfluenceService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    public List<Map<String, Object>> searchRelatedPages(String baseUrl, String email, String apiToken,
                                                         String storyId, String storySummary,
                                                         List<String> spaceKeys) throws Exception {
        List<Map<String, Object>> pages = new ArrayList<>();
        String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());
        String base = baseUrl.replaceAll("/$", "");

        // Build CQL query to find pages related to this story
        List<String> cqlParts = new ArrayList<>();

        // Search by Jira issue ID mention
        cqlParts.add("text ~ \"" + storyId + "\"");

        // Extract keywords from summary (words > 4 chars)
        if (storySummary != null && !storySummary.isBlank()) {
            String[] words = storySummary.split("\\s+");
            List<String> keywords = new ArrayList<>();
            for (String word : words) {
                String clean = word.replaceAll("[^a-zA-Z0-9]", "");
                if (clean.length() > 4) keywords.add(clean);
            }
            if (!keywords.isEmpty()) {
                String keywordQuery = "title ~ \"" + String.join(" OR title ~ \"", keywords) + "\"";
                cqlParts.add(keywordQuery);
            }
        }

        // Add space filter if provided
        String spaceFilter = "";
        if (spaceKeys != null && !spaceKeys.isEmpty()) {
            spaceFilter = " AND space in (" +
                    String.join(",", spaceKeys.stream().map(k -> "\"" + k + "\"").toList()) + ")";
        }

        List<Map<String, Object>> seen = new ArrayList<>();
        for (String cqlPart : cqlParts) {
            String cql = URLEncoder.encode(cqlPart + spaceFilter, StandardCharsets.UTF_8);
            String url = base + "/wiki/rest/api/content/search?cql=" + cql +
                    "&expand=body.view,metadata.labels&limit=3";

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Authorization", "Basic " + auth)
                        .header("Accept", "application/json")
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode results = root.get("results");
                    if (results != null && results.isArray()) {
                        for (JsonNode page : results) {
                            String pageId = page.has("id") ? page.get("id").asText() : "";
                            // Avoid duplicates
                            boolean duplicate = pages.stream()
                                    .anyMatch(p -> pageId.equals(p.get("id")));
                            if (!duplicate) {
                                Map<String, Object> pageMap = new HashMap<>();
                                pageMap.put("id", pageId);
                                pageMap.put("title", page.has("title") ? page.get("title").asText() : "");
                                pageMap.put("url", base + "/wiki" + (page.has("_links") ?
                                        page.get("_links").path("webui").asText("") : ""));

                                // Extract text content
                                String bodyText = "";
                                if (page.has("body") && page.get("body").has("view")) {
                                    String html = page.get("body").get("view").path("value").asText("");
                                    bodyText = stripHtml(html);
                                    if (bodyText.length() > 3000) {
                                        bodyText = bodyText.substring(0, 3000) + "...";
                                    }
                                }
                                pageMap.put("content", bodyText);
                                pages.add(pageMap);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Continue with other searches if one fails
            }
        }

        return pages;
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html
                .replaceAll("<[^>]+>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&quot;", "\"")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public Map<String, Object> fetchPageByUrl(String email, String apiToken, String pageUrl) throws Exception {
        String auth = Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes());

        // Extract base URL and page ID from Confluence URL
        // Supports formats:
        //   https://company.atlassian.net/wiki/spaces/SPACE/pages/123456/Page+Title
        //   https://company.atlassian.net/wiki/pages/viewpage.action?pageId=123456
        String pageId = extractPageId(pageUrl);
        String baseUrl = extractBaseUrl(pageUrl);

        if (pageId == null) {
            System.out.println("Could not extract page ID from URL: " + pageUrl);
            return null;
        }

        String url = baseUrl + "/wiki/rest/api/content/" + pageId + "?expand=body.view";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + auth)
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            System.out.println("Failed to fetch Confluence page " + pageUrl + ": HTTP " + response.statusCode());
            return null;
        }

        JsonNode page = objectMapper.readTree(response.body());
        Map<String, Object> pageMap = new HashMap<>();
        pageMap.put("id", page.path("id").asText(""));
        pageMap.put("title", page.path("title").asText(""));
        pageMap.put("url", pageUrl);

        String html = page.path("body").path("view").path("value").asText("");
        String text = stripHtml(html);
        if (text.length() > 3000) text = text.substring(0, 3000) + "...";
        pageMap.put("content", text);

        return pageMap;
    }

    private String extractPageId(String url) {
        // Format: /pages/123456/
        java.util.regex.Matcher m1 = java.util.regex.Pattern
                .compile("/pages/(\\d+)").matcher(url);
        if (m1.find()) return m1.group(1);

        // Format: pageId=123456
        java.util.regex.Matcher m2 = java.util.regex.Pattern
                .compile("[?&]pageId=(\\d+)").matcher(url);
        if (m2.find()) return m2.group(1);

        return null;
    }

    private String extractBaseUrl(String url) {
        // Returns https://company.atlassian.net
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(https?://[^/]+)").matcher(url);
        return m.find() ? m.group(1) : "";
    }
}

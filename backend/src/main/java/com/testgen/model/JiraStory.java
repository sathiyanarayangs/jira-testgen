package com.testgen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JiraStory {
    private String id;
    private String key;
    private Fields fields;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public Fields getFields() { return fields; }
    public void setFields(Fields fields) { this.fields = fields; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Fields {
        private String summary;
        private Description description;
        @JsonProperty("customfield_10016")
        private Object storyPoints;
        private List<Map<String, Object>> subtasks;
        private Map<String, Object> issuetype;
        private Map<String, Object> status;
        private Map<String, Object> priority;
        private Map<String, Object> assignee;
        private String customfield_10014; // Epic link
        private List<Map<String, Object>> components;
        private List<String> labels;
        private Object acceptanceCriteria; // customfield varies by instance
        @JsonProperty("customfield_10041")
        private Object acceptanceCriteriaAlt;

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public Description getDescription() { return description; }
        public void setDescription(Description description) { this.description = description; }
        public Object getStoryPoints() { return storyPoints; }
        public void setStoryPoints(Object storyPoints) { this.storyPoints = storyPoints; }
        public List<Map<String, Object>> getSubtasks() { return subtasks; }
        public void setSubtasks(List<Map<String, Object>> subtasks) { this.subtasks = subtasks; }
        public Map<String, Object> getIssuetype() { return issuetype; }
        public void setIssuetype(Map<String, Object> issuetype) { this.issuetype = issuetype; }
        public Map<String, Object> getStatus() { return status; }
        public void setStatus(Map<String, Object> status) { this.status = status; }
        public Map<String, Object> getPriority() { return priority; }
        public void setPriority(Map<String, Object> priority) { this.priority = priority; }
        public Map<String, Object> getAssignee() { return assignee; }
        public void setAssignee(Map<String, Object> assignee) { this.assignee = assignee; }
        public String getCustomfield_10014() { return customfield_10014; }
        public void setCustomfield_10014(String customfield_10014) { this.customfield_10014 = customfield_10014; }
        public List<Map<String, Object>> getComponents() { return components; }
        public void setComponents(List<Map<String, Object>> components) { this.components = components; }
        public List<String> getLabels() { return labels; }
        public void setLabels(List<String> labels) { this.labels = labels; }
        public Object getAcceptanceCriteria() { return acceptanceCriteria; }
        public void setAcceptanceCriteria(Object acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }
        public Object getAcceptanceCriteriaAlt() { return acceptanceCriteriaAlt; }
        public void setAcceptanceCriteriaAlt(Object acceptanceCriteriaAlt) { this.acceptanceCriteriaAlt = acceptanceCriteriaAlt; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Description {
        private String type;
        private String version;
        private List<Map<String, Object>> content;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public List<Map<String, Object>> getContent() { return content; }
        public void setContent(List<Map<String, Object>> content) { this.content = content; }
    }
}

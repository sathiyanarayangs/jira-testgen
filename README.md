# TestGen AI — Jira + Confluence → AI Test Case Generator

AI-powered test case generator that combines **Jira story data** and **Confluence documentation** to produce comprehensive, context-aware test cases using **Google Gemini 2.5 Flash**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│              (Vite + React 18, dark UI)                  │
│                   localhost:3000                         │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│                  Spring Boot Backend                     │
│               (Java 17, port 8080)                       │
│   ┌──────────────────────────────────────────────────┐  │
│   │  TestCaseController → TestCaseService             │  │
│   │       ├── JiraService (REST API v3)               │  │
│   │       ├── ConfluenceService (CQL Search)          │  │
│   │       └── GeminiService (Gemini 2.5 Flash)        │  │
│   └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
         │              │                    │
    Jira Cloud    Confluence Cloud    Google AI Studio
```

---

## Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+** and **npm**
- **Jira Cloud** account with API access
- **Confluence Cloud** account (optional but recommended)
- **Google AI Studio** account with Gemini API access

---

## Quick Start

### 1. Clone / Extract
```bash
unzip jira-testgen.zip
cd jira-testgen
```

### 2. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts on **http://localhost:8080**

### 3. Start the Frontend

```bash
cd frontend
npm install
npm start
```

Frontend opens on **http://localhost:3000**

---

## Configuration (In-App)

All credentials are entered **in the UI** — no need to edit config files for standard usage.

### Jira Settings
| Field | Description |
|-------|-------------|
| Jira Base URL | `https://yourcompany.atlassian.net` |
| Email | Your Atlassian account email |
| API Token | Generate at [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) |

### Confluence Settings (Optional)
| Field | Description |
|-------|-------------|
| Confluence Base URL | Usually same as Jira URL |
| Email | Usually same as Jira email |
| API Token | Usually same as Jira token |
| Space Keys | Comma-separated space keys (e.g., `DEV,QA`) |

### Gemini AI Settings
| Field | Description |
|-------|-------------|
| API Key | Get from [Google AI Studio](https://aistudio.google.com/apikey) |

---

## How It Works

```
1. User enters Jira Story ID (e.g., "PROJ-1234")
   ↓
2. Backend fetches full story from Jira REST API v3
   - Summary, Description (ADF format → plain text)
   - Acceptance Criteria (custom field)
   - Status, Priority, Type, Components
   ↓
3. Backend searches Confluence for related pages
   - Searches by story ID mention
   - Searches by keywords from story title
   - Extracts page content (HTML → plain text)
   ↓
4. Everything is sent to Gemini 2.5 Flash with a detailed prompt
   - Story context + Confluence docs = richer context
   - AI generates 8-15 comprehensive test cases
   - Covers: Positive, Negative, Edge Cases, Security, Performance
   ↓
5. Test cases are returned as structured JSON
   - Each with: ID, Title, Category, Priority, Type,
     Preconditions, Steps, Expected Result, Tags
   ↓
6. Frontend displays with filtering, tabs, and CSV export
```

---

## API Endpoints

### POST /api/generate
Generate test cases for a Jira story.

**Request Body:**
```json
{
  "jiraStoryId": "PROJ-1234",
  "jiraBaseUrl": "https://yourcompany.atlassian.net",
  "jiraEmail": "you@company.com",
  "jiraToken": "your-api-token",
  "confluenceBaseUrl": "https://yourcompany.atlassian.net",
  "confluenceEmail": "you@company.com",
  "confluenceToken": "your-api-token",
  "confluenceSpaceKeys": ["DEV", "QA"],
  "geminiApiKey": "your-gemini-key",
  "additionalContext": "Focus on mobile scenarios..."
}
```

**Response:**
```json
{
  "storyInfo": {
    "storyId": "PROJ-1234",
    "summary": "As a user, I want to...",
    "description": "...",
    "acceptanceCriteria": "...",
    "status": "In Progress",
    "priority": "High",
    "type": "Story",
    "confluencePages": [...]
  },
  "testCases": [
    {
      "id": "TC-001",
      "title": "Verify successful login with valid credentials",
      "category": "Functional",
      "priority": "Critical",
      "type": "Positive",
      "preconditions": "User exists in the system",
      "steps": ["Navigate to login page", "Enter valid email", "Enter valid password", "Click Login"],
      "expectedResult": "User is redirected to dashboard",
      "tags": ["login", "auth", "smoke"]
    }
  ],
  "totalTestCases": 12,
  "summary": "Generated 12 test cases for PROJ-1234 using Jira data + 3 Confluence pages."
}
```

### GET /api/health
```json
{ "status": "UP", "service": "Jira Test Case Generator", "version": "1.0.0" }
```

---

## Features

- **Deep Confluence Integration** — Finds related docs using CQL search with story ID and keyword matching
- **Smart Context Building** — Combines Jira description + acceptance criteria + Confluence docs into a rich prompt
- **Gemini 2.5 Flash** — Fast, intelligent, structured test case generation
- **8-15 Test Cases** — Covering positive, negative, edge, security, and performance scenarios
- **Filterable UI** — Filter by type, priority, category; search by text
- **CSV Export** — Export all test cases with one click
- **Copy Individual Cases** — Copy any test case as formatted text
- **Confluence Optional** — Works without Confluence, just with Jira data

---

## Jira Acceptance Criteria Custom Fields

Different Jira instances store acceptance criteria in different custom fields. The app tries:
- `customfield_10041` (common)
- `customfield_10016` (story points field, skipped)
- Standard `acceptanceCriteria` field

If your instance uses a different field, update `JiraStory.java` → `Fields` class.

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Jira authentication failed` | Check email and API token |
| `Story not found` | Verify the story ID format (e.g., PROJ-1234) |
| `Gemini API error` | Check API key; ensure Gemini 2.5 Flash is enabled |
| `Confluence returns no pages` | Try adding Space Keys; check Confluence URL |
| CORS errors | Backend must be on port 8080; frontend on 3000 |

---

## Building for Production

### Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/jira-testgen-1.0.0.jar
```

### Frontend
```bash
cd frontend
npm run build
# Serve /build with any static file server or nginx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2 (Java 17) |
| HTTP Client | Java 11 `java.net.http.HttpClient` |
| JSON | Jackson Databind |
| Frontend | React 18 + Create React App |
| HTTP Client (FE) | Axios |
| AI | Google Gemini 2.5 Flash |
| Source | Jira REST API v3 + Confluence REST API |
| Styling | Custom CSS (no framework) |

# Implementation Notes: Chief AI Memo Generator Prototype

## Purpose

This prototype demonstrates a **meeting preparation intelligence system** for political leaders (mayors, governors, etc.). Built as a proof-of-concept in late 2024/early 2025, it shows how Chief AI can synthesize data from multiple sources into actionable briefing memos.

**User Flow:**
1. User views calendar event with attendees from an organization (e.g., Denver Public Schools)
2. Clicks "Generate Memo" to trigger synthesis
3. System shows loading state with data aggregation steps (profiles, news, interactions)
4. Full memo displays with attendee backgrounds, talking points, alerts, and relationship context

**Tech Stack:** Single-page HTML demo with vanilla JavaScript, zero build process. Deployed via Vercel.

## What's Real vs. Mock

### 100% Simulated
- All attendee data (Dr. Alex Johnson, Maria Rodriguez)
- Organization profiles (Denver Public Schools)
- News articles (Denver Post, Chalkbeat sources)
- Interaction history (emails, meetings, calls)
- Approval workflow statuses
- Team member lists
- Dates (November 2025 timeline)

### Real Product Patterns Demonstrated
- **Data aggregation architecture**: Events + Profiles + Organizations + News → Synthesized Memo
- **Confidence scoring**: Based on data freshness and completeness
- **Relationship context synthesis**: Cross-referencing multiple interaction types
- **Recency weighting**: Interactions <7 days get green pulse indicator
- **Smart highlighting**: Concerns (yellow) vs. opportunities (green)
- **Topic extraction**: Cross-references event agenda, org initiatives, attendee priorities
- **Attribution transparency**: All news shows source + date

## Key Design Decisions

### 1. Manual Trigger (Not Automatic)
The "Generate Memo" button requires explicit user action. Rationale: Gives users control over when synthesis happens, allows previewing calendar event first, and avoids generating memos for routine/internal meetings.

### 2. 3-Screen Flow
- **Screen 1 (Calendar Event)**: Context setting, shows what data will be used
- **Screen 2 (Loading)**: Builds trust by showing data sources being accessed
- **Screen 3 (Memo)**: Full synthesis with editing/approval/sharing features

### 3. Data Architecture
```
MeetingEvent → attendees[] (references profileId)
Profile → bio, priorities, recentInteractions[], relationshipNotes
Organization → recentNews[], keyInitiatives[], relationship
Memo → sections{} + metadata{dataSources, confidence}
```
Normalized structure prevents duplication. Optional fields allow graceful degradation.

### 4. Synthesis Over Concatenation
- `extractTopics()` cross-references event + org initiatives + attendee priorities
- Talking points reference specific news with dates/amounts
- Meeting context combines multiple data points into narrative prose
- Not just dumping raw data into sections

### 5. Smart Alerts (4 Types)
- Warning: "No recent interactions with [person] (67 days ago)"
- Info: "AI Insight: Priority Alignment Detected"
- Success: "Strong Partnership Opportunity"
- Error: "Budget Sensitivity - Q4 constraints mentioned"

Alerts appear contextually within memo sections, not as separate banner.

### 6. Zero Build Process
Pure HTML/CSS/JavaScript with Tailwind CDN. No Node.js, npm, webpack, or framework. Allows rapid iteration and easy deployment for stakeholder demos.

## For Production Implementation

### Required Data Sources
1. **Calendar Systems**: Microsoft Graph (Outlook), Google Calendar API
2. **CRM Integration**: Salesforce, HubSpot for contact/org data
3. **News APIs**: NewsAPI, Google News, or industry-specific feeds
4. **Email Parsing**: Microsoft Graph Mail, Gmail API for interaction history
5. **Internal Knowledge Base**: Org-specific notes, past meeting summaries

### Architecture
```
Event Ingestion → Data Aggregation → AI Synthesis → Memo Generation
     ↓                    ↓                ↓              ↓
  Calendar API      Profile Enrichment   LLM Processing   UI Rendering
                    News Retrieval       Topic Extraction
                    Interaction History  Talking Points
```

### AI/ML Components Needed
- **NLP Summarization**: Email/meeting content → key points
- **Topic Extraction**: Beyond keyword matching, understand themes
- **Relevance Scoring**: Which news articles matter for this meeting?
- **Sentiment Analysis**: Interaction history tone (positive/negative/neutral)
- **Priority Inference**: What does this person care about based on communication patterns?

### Access Control Considerations
- Meeting type-based detail levels (internal/external/public)
- User permissions for viewing sensitive interaction history
- Approval workflows tied to organizational hierarchy
- Data sensitivity classification (public statements vs. private negotiations)

### Not Yet Implemented
- Actual PDF export (currently shows toast notification only)
- Email integration for sending memos
- Edit functionality (toolbar is visual only in prototype)
- Custom reminder date picker
- Team member selection/removal
- Approval chain configuration
- Search/filter across historical memos
- Multi-meeting comparison view

## Open Questions

1. **LLM Provider**: OpenAI (GPT-4), Anthropic (Claude), open-source (Llama), or hybrid approach?
2. **Versioning Strategy**: Track memo edits? Show "Regenerate" button if data updates?
3. **Integration Priorities**: Which calendar/CRM first? Phased rollout?
4. **Data Retention**: How long to store interaction history? GDPR/privacy compliance?
5. **Edit vs. Regenerate**: Allow manual edits or force regeneration for data changes?
6. **Mobile App Scope**: Read-only mobile view or full generation capability?
7. **Real-Time Collaboration**: Multi-user editing like Google Docs?
8. **Confidence Thresholds**: When to show "Insufficient data" warning vs. generating partial memo?

---

**Files:**
- [memo-demo.html](memo-demo.html) - Main prototype (2474 lines)
- [memoGenerator.ts](memoGenerator.ts) - TypeScript reference implementation (503 lines)
- [vercel.json](vercel.json) - Deployment configuration

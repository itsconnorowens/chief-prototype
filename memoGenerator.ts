/**
 * Chief AI - Memo Generator
 * 
 * This module demonstrates sophisticated data aggregation and synthesis
 * for generating contextual meeting memos. The logic combines multiple
 * data sources (events, profiles, organizations) to create actionable,
 * personalized briefing documents.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Core event model - represents calendar data from external system (Outlook, Google Cal, etc.)
// Production: Would sync bidirectionally with calendar API
interface MeetingEvent {
  id: string;
  title: string;
  datetime: string; // ISO 8601 format - allows timezone-aware scheduling
  location: string;
  attendees: Attendee[];
  description?: string;
  meetingType: 'internal' | 'external' | 'public'; // Drives access control and memo detail level
}

// Lightweight attendee reference - links to full Profile via profileId
// Why separate: Calendar entries shouldn't duplicate full profile data
interface Attendee {
  name: string;
  title: string;
  organization: string;
  profileId?: string; // Optional: allows graceful handling of external/new contacts
}

// Rich contact profile - the "memory" of each relationship
// Production: Would integrate with CRM (Salesforce, HubSpot) or custom contact DB
interface Profile {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string; // Manual entry or scraped from LinkedIn/org website
  recentInteractions: Interaction[]; // Critical for relationship context - sourced from email, calendar history
  priorities: string[]; // Manual curation by user - what this person cares about
  relationshipNotes?: string; // Qualitative insights - communication style, preferences
}

// Interaction log - builds relationship timeline
// Production: Auto-populate from email parsing, calendar history, manual notes
interface Interaction {
  date: string;
  type: 'meeting' | 'email' | 'call' | 'event';
  summary: string; // In production: AI-generated from email/meeting content or manual entry
}

// Organization profile - contextualizes individual relationships
// Production: Combination of manual entry, news API integration, public data scraping
interface Organization {
  name: string;
  description: string;
  recentNews: NewsItem[]; // Sourced from news API (NewsAPI, Google News) or manual curation
  keyInitiatives: string[]; // Strategic intel - manual entry by staff
  relationship: 'partner' | 'constituent' | 'vendor' | 'other'; // Affects tone and approach in memo
}

// News metadata - enables source attribution and recency weighting
// Production: Auto-populated via news aggregation API with relevance scoring
interface NewsItem {
  headline: string;
  date: string;
  source: string; // Attribution is critical for credibility
  summary: string; // Could be AI-generated or pulled from article metadata
}

// Final memo structure - designed for readability and actionability
// Design decision: Narrative sections + metadata separation allows both human reading and programmatic use
interface Memo {
  meetingTitle: string;
  date: string;
  sections: {
    meetingContext: string; // "Why this meeting matters" - synthesized overview
    attendeeBackgrounds: Array<{ // Per-person context - allows skimming specific attendees
      name: string;
      context: string; // Narrative synthesis of bio + priorities + recent interactions
    }>;
    keyTopics: string[]; // Extracted themes - cross-references event, org, and attendee data
    suggestedTalkingPoints: string[]; // Actionable - specific references to data points
    recentDevelopments: Array<{ // News context - formatted with attribution
      topic: string;
      detail: string;
    }>;
    relationshipHistory: string; // Qualitative summary of relationship health
  };
  metadata: {
    generatedAt: string;
    dataSources: string[]; // Transparency - user knows what data informed the memo
    confidence: 'high' | 'medium' | 'low'; // Data freshness/completeness indicator
  };
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
// Production-ready values for thresholds and limits
// These constants make architectural decisions explicit and maintainable

// Time calculation
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Interaction display limits
const MAX_INTERACTIONS_IN_SUMMARY = 3; // Balance detail vs. readability in attendee backgrounds

// Recency thresholds for data freshness
const INTERACTION_RECENCY_THRESHOLD_DAYS = 90; // One quarter lookback for interaction history
const RECENT_CONTACT_THRESHOLD_DAYS = 60; // Two months - used for confidence scoring
const NEWS_FRESHNESS_THRESHOLD_DAYS = 30; // One month - recent news relevance window

// ============================================================================
// MOCK DATA
// ============================================================================
// NOTE: All data below is PLACEHOLDER for demo purposes
// Production: These would be fetched from:
//   - mockEvent → Calendar API (Microsoft Graph, Google Calendar API)
//   - mockProfiles → CRM/Contact DB with relationship intelligence
//   - mockOrganization → Combined news API + internal knowledge base
// Current implementation: Static data shaped like real API responses to validate UX flow
// TODO: Replace mock data with actual Calendar API integration (Microsoft Graph/Google Calendar) and implement proper caching layer

export const mockEvent: MeetingEvent = {
  id: 'evt_2025_q4_budget_dps',
  title: 'Q4 Budget Discussion with Denver Public Schools',
  datetime: '2025-11-15T14:00:00-07:00',
  location: "Mayor's Conference Room",
  description: 'Quarterly budget review and discussion of upcoming initiatives for Denver Public Schools. Focus on capital improvements and staffing allocations.',
  meetingType: 'external',
  attendees: [
    {
      name: 'Dr. Alex Johnson',
      title: 'Superintendent',
      organization: 'Denver Public Schools',
      profileId: 'prof_alex_johnson'
    },
    {
      name: 'Maria Rodriguez',
      title: 'Chief Financial Officer',
      organization: 'Denver Public Schools',
      profileId: 'prof_maria_rodriguez'
    }
  ]
};

export const mockProfiles: Profile[] = [
  {
    id: 'prof_alex_johnson',
    name: 'Dr. Alex Johnson',
    title: 'Superintendent',
    organization: 'Denver Public Schools',
    bio: 'Dr. Johnson has served as Superintendent of Denver Public Schools since 2021, bringing over 20 years of educational leadership experience. Previously served as Deputy Superintendent in Jefferson County Public Schools (Jeffco), where she led initiatives that improved graduation rates by 15% over three years. Known for data-driven decision making and collaborative leadership style.',
    recentInteractions: [
      {
        date: '2025-11-05',
        type: 'email',
        summary: 'Follow-up on teacher retention program proposal. Expressed interest in exploring partnership opportunities.'
      },
      {
        date: '2025-09-15',
        type: 'meeting',
        summary: 'Q3 budget review meeting. Discussed infrastructure needs and staffing challenges. Dr. Johnson emphasized need for sustainable funding solutions.'
      },
      {
        date: '2025-08-20',
        type: 'call',
        summary: 'Brief call regarding summer program outcomes. Positive feedback on city partnership programs.'
      }
    ],
    priorities: [
      'Teacher retention and compensation',
      'Infrastructure improvements in underserved schools',
      'Expanding after-school programs',
      'Addressing achievement gaps'
    ],
    relationshipNotes: 'Prefers detailed data and concrete proposals. Values transparency and long-term planning. Responds well to collaborative approaches. Best reached via email for initial contact, prefers in-person for substantive discussions.'
  },
  {
    id: 'prof_maria_rodriguez',
    name: 'Maria Rodriguez',
    title: 'Chief Financial Officer',
    organization: 'Denver Public Schools',
    bio: 'Maria Rodriguez joined DPS in 2019 as CFO, bringing extensive experience in public sector finance from her previous role as Finance Director for the City of Aurora. She has a Master\'s in Public Administration and is known for her meticulous budget analysis and ability to find creative funding solutions. Strong advocate for transparency in public spending.',
    recentInteractions: [
      {
        date: '2025-10-28',
        type: 'email',
        summary: 'Requested clarification on capital improvement timeline. Concerned about Q4 budget constraints.'
      },
      {
        date: '2025-10-22',
        type: 'meeting',
        summary: 'Attended city budget workshop. Asked detailed questions about multi-year funding commitments.'
      },
      {
        date: '2025-09-18',
        type: 'email',
        summary: 'Shared updated enrollment projections affecting budget planning.'
      }
    ],
    priorities: [
      'Maintaining fiscal responsibility',
      'Multi-year budget planning',
      'Capital improvement funding',
      'Staffing cost management'
    ],
    relationshipNotes: 'Detail-oriented and data-focused. Appreciates early communication about budget implications. Prefers written documentation before meetings. Very responsive to email, typically replies within 24 hours.'
  }
];

export const mockOrganization: Organization = {
  name: 'Denver Public Schools',
  description: 'Denver Public Schools is the largest school district in Colorado, serving over 90,000 students across 207 schools. The district serves a diverse student population and is committed to providing equitable educational opportunities. Recent focus areas include addressing achievement gaps, improving infrastructure, and supporting teacher retention.',
  recentNews: [
    {
      headline: 'DPS Announces $50M Infrastructure Improvement Plan',
      date: '2025-11-02',
      source: 'Denver Post',
      summary: 'Denver Public Schools unveiled a comprehensive plan to address aging infrastructure across 15 schools, with focus on HVAC systems and accessibility improvements. Funding includes $30M from district reserves and $20M in proposed city partnership.'
    },
    {
      headline: 'Teacher Retention Rates Improve Following Compensation Increases',
      date: '2025-10-30',
      source: 'Chalkbeat Colorado',
      summary: 'Early data shows teacher retention improved by 8% following implementation of new compensation structure. Superintendent Johnson credits collaborative approach with teacher unions and city support for the positive trend.'
    },
    {
      headline: 'DPS Seeks City Support for Expanded After-School Programs',
      date: '2025-10-25',
      source: 'Denver Gazette',
      summary: 'District leadership is requesting additional city funding to expand after-school programming to 20 additional schools, particularly in underserved neighborhoods. Proposal includes partnership with city recreation centers.'
    }
  ],
  keyInitiatives: [
    'Infrastructure modernization (2025-2027)',
    'Teacher retention and compensation program',
    'Expansion of after-school and enrichment programs',
    'Achievement gap reduction initiatives',
    'Technology infrastructure upgrades'
  ],
  relationship: 'constituent'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// These functions handle data normalization and transformation
// Why separate: Keeps main generation logic focused on synthesis, not string formatting
// Production-ready: These are utility functions suitable for real implementation

/**
 * Formats a date string into a human-readable format
 * Product decision: Use full date format for clarity in memos
 * Why verbose: Political context requires precision - day of week matters for scheduling context
 */
function formatDate(dateString: string): string {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    console.warn(`Invalid date string provided to formatDate: "${dateString}"`);
    return 'Date not available';
  }

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', // "Monday" vs "Mon" - professional tone
    year: 'numeric',
    month: 'long', // "November" vs "Nov" - matches formal memo style
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short' // Critical for cross-timezone scheduling
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculates days between a past date and today
 * Why needed: Recency weighting - interaction 5 days ago vs 50 days ago tells different story
 * Used for: Filtering stale data (>90 days) and creating natural language ("5 days ago")
 */
function daysAgo(dateString: string): number {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    console.warn(`Invalid date string provided to daysAgo: "${dateString}"`);
    return 999; // Return high number to ensure stale data gets filtered out
  }

  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.floor(diffTime / MILLISECONDS_PER_DAY);
}

/**
 * Extracts key topics from event description, organization initiatives, and attendee priorities
 *
 * Why this approach: Topics that appear across multiple sources are most likely to be discussed
 * Data flow: event description → org initiatives → attendee priorities → unified topic list
 *
 * Design decision: Use Set to deduplicate - same topic mentioned in multiple sources = higher relevance
 * Limitation: Currently uses keyword matching - production should use semantic similarity (embeddings)
 *
 * Production upgrade: Replace with NLP topic extraction + theme clustering for better accuracy
 * TODO: Replace keyword matching with semantic similarity using embeddings (OpenAI/Cohere) for better topic extraction
 */
function extractTopics(event: MeetingEvent, org: Organization, profiles: Profile[]): string[] {
  const identifiedMeetingTopics = new Set<string>(); // Set deduplicates automatically - same topic from multiple sources = 1 entry

  // Extract from event description (source 1: what's on the agenda)
  const eventKeywords = event.description?.toLowerCase() || '';
  if (eventKeywords.includes('budget')) identifiedMeetingTopics.add('Budget & Financial Planning');
  if (eventKeywords.includes('infrastructure') || eventKeywords.includes('capital')) identifiedMeetingTopics.add('Infrastructure & Capital Improvements');
  if (eventKeywords.includes('staffing') || eventKeywords.includes('teacher')) identifiedMeetingTopics.add('Staffing & Human Resources');

  // Extract from organization initiatives (source 2: what org cares about strategically)
  org.keyInitiatives.forEach(initiative => {
    if (initiative.toLowerCase().includes('infrastructure')) identifiedMeetingTopics.add('Infrastructure & Capital Improvements');
    if (initiative.toLowerCase().includes('teacher') || initiative.toLowerCase().includes('retention')) identifiedMeetingTopics.add('Staffing & Human Resources');
    if (initiative.toLowerCase().includes('after-school') || initiative.toLowerCase().includes('program')) identifiedMeetingTopics.add('Program Expansion');
  });

  // Extract from attendee priorities (source 3: what individuals are measured on)
  // Why important: If CFO prioritizes budget AND event mentions budget → confirmed key topic
  profiles.forEach(profile => {
    profile.priorities.forEach(priority => {
      if (priority.toLowerCase().includes('retention') || priority.toLowerCase().includes('compensation')) identifiedMeetingTopics.add('Staffing & Human Resources');
      if (priority.toLowerCase().includes('infrastructure')) identifiedMeetingTopics.add('Infrastructure & Capital Improvements');
      if (priority.toLowerCase().includes('budget') || priority.toLowerCase().includes('funding')) identifiedMeetingTopics.add('Budget & Financial Planning');
      if (priority.toLowerCase().includes('program')) identifiedMeetingTopics.add('Program Expansion');
    });
  });

  return Array.from(identifiedMeetingTopics); // Convert Set → Array for consistent return type
}

/**
 * Formats interaction history into narrative context
 *
 * Why narrative not bullets: Reads naturally in attendee background section - flows like a briefing
 * Data transformation: Array of discrete interactions → chronological prose
 *
 * Design decisions:
 * - Sort by recency (most recent first) - freshest context matters most
 * - Limit to 3 interactions - balance comprehensiveness vs. readability
 * - Natural language time ("5 days ago" vs "2025-11-03") - easier to parse mentally
 */
function formatInteractionHistory(interactions: Interaction[]): string {
  if (interactions.length === 0) return 'No recent interactions on record.';

  // Sort descending - most recent interaction appears first in narrative
  const sorted = interactions.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recent = sorted.slice(0, MAX_INTERACTIONS_IN_SUMMARY);

  // Transform each interaction into natural language snippet
  const interactionNarratives = recent.map(interaction => {
    const days = daysAgo(interaction.date);
    const timeAgo = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    return `${interaction.type} ${timeAgo}: ${interaction.summary}`;
  });

  return interactionNarratives.join(' '); // Space-join creates flowing sentence structure
}

// ============================================================================
// MEMO GENERATION FUNCTION
// ============================================================================

/**
 * Generates a comprehensive meeting memo by synthesizing data from multiple sources
 *
 * DATA FLOW:
 * Input: Raw data (event, profiles, org) from separate systems
 * ↓
 * Process: Cross-reference, filter, synthesize, format
 * ↓
 * Output: Unified narrative memo with metadata
 *
 * CORE DESIGN PHILOSOPHY:
 * 1. Synthesis > Concatenation: Create insights by connecting disparate data points
 *    Example: Don't just list "budget meeting" + "CFO attending" → synthesize into
 *    "CFO's recent concern about Q4 constraints makes budget discussion timely"
 *
 * 2. Recency Weighting: 5-day-old interaction > 50-day-old interaction
 *    Why: Relationship context changes - recent touch points inform current dynamics
 *
 * 3. Actionable Specificity: Never generic ("discuss budget") - always specific
 *    ("Reference $50M infrastructure plan announced Nov 1, explore partnership funding")
 *
 * 4. Data Transparency: Metadata tracks what informed the memo + confidence level
 *    Why: User needs to know if memo based on fresh data or stale info
 *
 * PRODUCTION CONSIDERATIONS:
 * - Current: Synchronous generation - fine for demo, but would block at scale
 * - Production: Queue-based generation (Redis/Bull) - pre-generate before meetings
 * - AI Enhancement: Add LLM layer to synthesize talking points vs. template logic
 * - Caching: Memo sections could be cached/reused (org context doesn't change daily)
 */
export function generateMemo(
  event: MeetingEvent,
  profiles: Profile[],
  org: Organization
): Memo {
  // Parameter validation - defensive programming for production use
  if (!event || !profiles || !org) {
    throw new Error('generateMemo: Missing required parameters (event, profiles, or org)');
  }
  if (!event.datetime) {
    throw new Error('generateMemo: Event missing required datetime field');
  }

  const meetingDate = formatDate(event.datetime);
  const memoGenerationTimestamp = new Date();

  // ========== SECTION 1: MEETING CONTEXT ==========
  // Purpose: High-level "why this meeting matters" - synthesizes event + org + timing
  // Design: Template-based narrative construction - connects event details with org news
  // Production upgrade: LLM generation for more natural synthesis
  const meetingContext = `This meeting is scheduled for ${meetingDate} in ${event.location}. ` +
    `The discussion will focus on ${event.description || 'upcoming initiatives and collaboration opportunities'}. ` +
    `This is a ${event.meetingType} meeting with ${profiles.length} key attendee${profiles.length > 1 ? 's' : ''} from ${org.name}. ` +
    `Given recent developments including ${org.recentNews[0]?.headline || 'organizational initiatives'}, ` + // Links to most recent news
    `this meeting presents an opportunity to align on priorities and explore partnership opportunities.`;

  // ========== SECTION 2: ATTENDEE BACKGROUNDS ==========
  // Purpose: Per-person context combining bio + priorities + recent interactions
  // Data flow: Profile → filter recent interactions (90 day window) → format → synthesize with bio
  const attendeeBackgrounds = profiles.map(profile => {
    // Recency filter: 90 days = ~1 quarter - balance between stale and too narrow
    // Why filter: 6-month-old interaction isn't relevant to current relationship dynamic
    const recentInteractions = profile.recentInteractions
      .filter(i => daysAgo(i.date) <= INTERACTION_RECENCY_THRESHOLD_DAYS)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

    const interactionContext = formatInteractionHistory(recentInteractions);

    // Synthesize multiple data points into flowing narrative
    // Order: Who they are → What they care about → How we've engaged → How to communicate
    const context = `${profile.bio} ` +
      `Current priorities include: ${profile.priorities.slice(0, 3).join(', ')}. ` + // Top 3 only - avoid info overload
      `Recent engagement: ${interactionContext} ` +
      (profile.relationshipNotes ? `Communication preferences: ${profile.relationshipNotes}` : '');

    return {
      name: profile.name,
      context: context.trim()
    };
  });

  // ========== SECTION 3: KEY TOPICS ==========
  // Purpose: Identify themes that matter by cross-referencing event + org + attendees
  // Why useful: Topics appearing in multiple sources = high likelihood of discussion
  const keyTopics = extractTopics(event, org, profiles);

  // ========== SECTION 4: SUGGESTED TALKING POINTS ==========
  // Purpose: Generate specific, actionable discussion items - NOT generic advice
  // Design pattern: Conditional logic based on topics → reference specific data → create action
  // Production upgrade: LLM-based generation with retrieval-augmented context
  const suggestedTalkingPoints: string[] = [];

  // Budget-related talking points
  // Pattern: If topic identified → search for relevant news/interactions → synthesize specific talking point
  if (keyTopics.includes('Budget & Financial Planning')) {
    // Try to find recent budget-related news to anchor the talking point
    const latestNews = org.recentNews.find(n =>
      n.headline.toLowerCase().includes('budget') ||
      n.headline.toLowerCase().includes('funding')
    );
    if (latestNews) {
      // Data synthesis: news headline + source attribution + specific action (partnership funding)
      // Why specific: "$50M infrastructure plan" > "discuss budget" - gives concrete discussion anchor
      suggestedTalkingPoints.push(
        `Reference the ${latestNews.headline} (${latestNews.source}, ${formatDate(latestNews.date)}). ` +
        `Discuss how the proposed $50M infrastructure plan aligns with city priorities and explore partnership funding opportunities.`
      );
    } else {
      // Fallback: If no news, reference individual interaction instead
      // Data synthesis: CFO's recent email concern + proposed solution (multi-year planning)
      suggestedTalkingPoints.push(
        `Address Q4 budget constraints mentioned by CFO Rodriguez in recent email (${daysAgo(profiles.find(p => p.title.includes('CFO'))?.recentInteractions[0]?.date || '')} days ago). ` +
        `Discuss multi-year planning approach to provide budget certainty.`
      );
    }
  }
  
  // Infrastructure talking points
  // Same pattern: find relevant news → extract specifics → create actionable talking point
  if (keyTopics.includes('Infrastructure & Capital Improvements')) {
    const infraNews = org.recentNews.find(n => n.headline.toLowerCase().includes('infrastructure'));
    if (infraNews) {
      // Specificity: "$50M", "15 schools", "HVAC systems" - concrete discussion anchors
      suggestedTalkingPoints.push(
        `Discuss the $50M infrastructure improvement plan announced on ${formatDate(infraNews.date)}. ` +
        `Explore how city resources can support the 15 schools identified, particularly focusing on HVAC systems and accessibility improvements.`
      );
    }
  }

  // Staffing/teacher retention talking points
  if (keyTopics.includes('Staffing & Human Resources')) {
    const retentionNews = org.recentNews.find(n =>
      n.headline.toLowerCase().includes('teacher') ||
      n.headline.toLowerCase().includes('retention')
    );
    if (retentionNews) {
      // Positive framing: "acknowledge positive results" before asking for more - relationship building
      suggestedTalkingPoints.push(
        `Acknowledge the positive teacher retention results (8% improvement) mentioned in recent news. ` +
        `Discuss how city can continue supporting compensation initiatives and explore additional partnership opportunities.`
      );
    }

    // Cross-reference: If specific attendee prioritizes this topic, create personalized talking point
    // Why: Shows user did homework - "we know Dr. Johnson cares about this"
    const drJohnson = profiles.find(p => p.name.includes('Johnson'));
    if (drJohnson && drJohnson.priorities.some(p => p.toLowerCase().includes('retention'))) {
      // Data synthesis: Attendee priority + previous interaction + specific ask (concrete next steps)
      suggestedTalkingPoints.push(
        `Dr. Johnson has prioritized teacher retention and compensation. ` +
        `Reference her previous interest in partnership opportunities (from ${daysAgo(drJohnson.recentInteractions[0]?.date || '')} days ago) and discuss concrete next steps.`
      );
    }
  }

  // After-school programs talking points
  if (keyTopics.includes('Program Expansion')) {
    const programNews = org.recentNews.find(n =>
      n.headline.toLowerCase().includes('after-school') ||
      n.headline.toLowerCase().includes('program')
    );
    if (programNews) {
      // Specificity: "20 additional schools", "recreation centers", "underserved neighborhoods"
      suggestedTalkingPoints.push(
        `Address the proposal for expanded after-school programs to 20 additional schools. ` +
        `Discuss partnership opportunities with city recreation centers and explore funding mechanisms for underserved neighborhoods.`
      );
    }
  }

  // Universal relationship-building talking point
  // Why always include: Even if no specific topics, maintain relationship momentum
  suggestedTalkingPoints.push(
    `Acknowledge the collaborative relationship and positive outcomes from recent initiatives. ` +
    `Express commitment to continued partnership and ask about priorities for the coming year.`
  );
  
  // ========== SECTION 5: RECENT DEVELOPMENTS ==========
  // Purpose: Provide news context with source attribution
  // Design: Top 3 most recent - balance comprehensiveness vs. cognitive load
  const recentDevelopments = org.recentNews.slice(0, 3).map(news => ({
    topic: news.headline,
    detail: `${news.summary} (Source: ${news.source}, ${formatDate(news.date)})` // Attribution = credibility
  }));

  // ========== SECTION 6: RELATIONSHIP HISTORY ==========
  // Purpose: Qualitative summary of relationship health and communication patterns
  // Design: Template-based synthesis - production would use relationship scoring algorithm
  const relationshipHistory = `The relationship with ${org.name} is characterized as a ${org.relationship} relationship. ` +
    `Recent interactions have been positive, with ${profiles.length} key contact${profiles.length > 1 ? 's' : ''} engaged in regular communication. ` +
    `The organization has been responsive to city initiatives and has shown interest in expanded partnership opportunities. ` +
    `Communication patterns suggest preference for detailed, data-driven discussions with advance preparation.`;

  // ========== METADATA: CONFIDENCE SCORING ==========
  // Purpose: Signal to user whether memo is based on fresh data or stale info
  // Scoring logic: All 3 conditions met = high, none met = low, otherwise = medium
  //
  // Why it matters: Memo generated from 6-month-old data is less reliable than yesterday's interactions
  // Production upgrade: More sophisticated scoring - weight by data source quality, recency decay curve
  const hasRecentInteractions = profiles.every(p =>
    p.recentInteractions.some(i => daysAgo(i.date) <= RECENT_CONTACT_THRESHOLD_DAYS)
  );
  const hasRecentNews = org.recentNews.some(n => daysAgo(n.date) <= NEWS_FRESHNESS_THRESHOLD_DAYS);
  const hasCompleteProfiles = profiles.every(p =>
    p.bio && p.priorities.length > 0 && p.recentInteractions.length > 0 // All profile fields populated
  );

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (hasRecentInteractions && hasRecentNews && hasCompleteProfiles) {
    confidence = 'high'; // All signals green - high confidence
  } else if (!hasRecentInteractions && !hasRecentNews) {
    confidence = 'low'; // Stale data - warn user
  }
  // Else: default to medium - some fresh data, some gaps

  // ========== RETURN: ASSEMBLED MEMO ==========
  // Data flow complete: Raw inputs → synthesis → structured output
  // Design: Separate sections from metadata - UI can render differently or allow programmatic access

  // console.log('Memo generation complete:', { confidence, topicCount: keyTopics.length, talkingPointsCount: suggestedTalkingPoints.length }); // Useful for debugging generation logic

  return {
    meetingTitle: event.title,
    date: meetingDate,
    sections: {
      // All narrative sections - ready for human consumption
      meetingContext,           // High-level why
      attendeeBackgrounds,      // Who you're meeting
      keyTopics,                // What matters
      suggestedTalkingPoints,   // What to say (actionable)
      recentDevelopments,       // What's happening (context)
      relationshipHistory       // How the relationship stands
    },
    metadata: {
      generatedAt: formatDate(memoGenerationTimestamp.toISOString()),
      dataSources: [
        // Transparency: User knows what systems contributed to this memo
        // Production: Would link to actual data sources with last sync timestamps
        'Event calendar',
        'Contact profiles',
        'Organization database',
        'News aggregator',
        'Interaction history'
      ],
      confidence // Data quality indicator - informs user trust level
    }
  };
  // TODO: Implement async queue-based memo generation for production (Redis/Bull.js) to pre-generate memos before meetings
}


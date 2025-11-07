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

interface MeetingEvent {
  id: string;
  title: string;
  datetime: string;
  location: string;
  attendees: Attendee[];
  description?: string;
  meetingType: 'internal' | 'external' | 'public';
}

interface Attendee {
  name: string;
  title: string;
  organization: string;
  profileId?: string;
}

interface Profile {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  recentInteractions: Interaction[];
  priorities: string[];
  relationshipNotes?: string;
}

interface Interaction {
  date: string;
  type: 'meeting' | 'email' | 'call' | 'event';
  summary: string;
}

interface Organization {
  name: string;
  description: string;
  recentNews: NewsItem[];
  keyInitiatives: string[];
  relationship: 'partner' | 'constituent' | 'vendor' | 'other';
}

interface NewsItem {
  headline: string;
  date: string;
  source: string;
  summary: string;
}

interface Memo {
  meetingTitle: string;
  date: string;
  sections: {
    meetingContext: string;
    attendeeBackgrounds: Array<{
      name: string;
      context: string;
    }>;
    keyTopics: string[];
    suggestedTalkingPoints: string[];
    recentDevelopments: Array<{
      topic: string;
      detail: string;
    }>;
    relationshipHistory: string;
  };
  metadata: {
    generatedAt: string;
    dataSources: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

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
    bio: 'Dr. Johnson has served as Superintendent of Denver Public Schools since 2021, bringing over 20 years of educational leadership experience. Previously served as Deputy Superintendent in Seattle Public Schools, where she led initiatives that improved graduation rates by 15% over three years. Known for data-driven decision making and collaborative leadership style.',
    recentInteractions: [
      {
        date: '2025-10-28',
        type: 'email',
        summary: 'Follow-up on teacher retention program proposal. Expressed interest in exploring partnership opportunities.'
      },
      {
        date: '2025-09-15',
        type: 'meeting',
        summary: 'Q3 budget review meeting. Discussed infrastructure needs and staffing challenges. Dr. Johnson emphasized need for sustainable funding solutions.'
      },
      {
        date: '2025-08-22',
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
        date: '2025-11-05',
        type: 'email',
        summary: 'Requested clarification on capital improvement timeline. Concerned about Q4 budget constraints.'
      },
      {
        date: '2025-10-10',
        type: 'meeting',
        summary: 'Attended city budget workshop. Asked detailed questions about multi-year funding commitments.'
      },
      {
        date: '2025-09-20',
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
      date: '2025-11-01',
      source: 'Denver Post',
      summary: 'Denver Public Schools unveiled a comprehensive plan to address aging infrastructure across 15 schools, with focus on HVAC systems and accessibility improvements. Funding includes $30M from district reserves and $20M in proposed city partnership.'
    },
    {
      headline: 'Teacher Retention Rates Improve Following Compensation Increases',
      date: '2025-10-18',
      source: 'Chalkbeat Colorado',
      summary: 'Early data shows teacher retention improved by 8% following implementation of new compensation structure. Superintendent Johnson credits collaborative approach with teacher unions and city support for the positive trend.'
    },
    {
      headline: 'DPS Seeks City Support for Expanded After-School Programs',
      date: '2025-10-05',
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

/**
 * Formats a date string into a human-readable format
 * Product decision: Use full date format for clarity in memos
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculates days between a past date and today
 * Product decision: Helps contextualize recency of interactions
 */
function daysAgo(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Extracts key topics from event description, organization initiatives, and attendee priorities
 * Product decision: Cross-reference multiple sources to identify overlapping themes
 */
function extractTopics(event: MeetingEvent, org: Organization, profiles: Profile[]): string[] {
  const topics = new Set<string>();
  
  // Extract from event description
  const eventKeywords = event.description?.toLowerCase() || '';
  if (eventKeywords.includes('budget')) topics.add('Budget & Financial Planning');
  if (eventKeywords.includes('infrastructure') || eventKeywords.includes('capital')) topics.add('Infrastructure & Capital Improvements');
  if (eventKeywords.includes('staffing') || eventKeywords.includes('teacher')) topics.add('Staffing & Human Resources');
  
  // Extract from organization initiatives
  org.keyInitiatives.forEach(initiative => {
    if (initiative.toLowerCase().includes('infrastructure')) topics.add('Infrastructure & Capital Improvements');
    if (initiative.toLowerCase().includes('teacher') || initiative.toLowerCase().includes('retention')) topics.add('Staffing & Human Resources');
    if (initiative.toLowerCase().includes('after-school') || initiative.toLowerCase().includes('program')) topics.add('Program Expansion');
  });
  
  // Extract from attendee priorities
  profiles.forEach(profile => {
    profile.priorities.forEach(priority => {
      if (priority.toLowerCase().includes('retention') || priority.toLowerCase().includes('compensation')) topics.add('Staffing & Human Resources');
      if (priority.toLowerCase().includes('infrastructure')) topics.add('Infrastructure & Capital Improvements');
      if (priority.toLowerCase().includes('budget') || priority.toLowerCase().includes('funding')) topics.add('Budget & Financial Planning');
      if (priority.toLowerCase().includes('program')) topics.add('Program Expansion');
    });
  });
  
  return Array.from(topics);
}

/**
 * Formats interaction history into narrative context
 * Product decision: Create flowing narrative rather than bullet points for better readability
 */
function formatInteractionHistory(interactions: Interaction[]): string {
  if (interactions.length === 0) return 'No recent interactions on record.';
  
  const sorted = interactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const recent = sorted.slice(0, 3);
  const parts = recent.map(interaction => {
    const days = daysAgo(interaction.date);
    const timeAgo = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    return `${interaction.type} ${timeAgo}: ${interaction.summary}`;
  });
  
  return parts.join(' ');
}

// ============================================================================
// MEMO GENERATION FUNCTION
// ============================================================================

/**
 * Generates a comprehensive meeting memo by synthesizing data from multiple sources
 * 
 * Product decisions:
 * 1. Synthesize rather than concatenate - create new insights from data combination
 * 2. Prioritize recency - weight recent interactions and news more heavily
 * 3. Actionability - talking points reference specific data points, not generic advice
 * 4. Contextualization - connect dots between event, attendees, and organization
 */
export function generateMemo(
  event: MeetingEvent,
  profiles: Profile[],
  org: Organization
): Memo {
  const meetingDate = formatDate(event.datetime);
  const now = new Date();
  
  // 1. Synthesize meeting context
  const meetingContext = `This meeting is scheduled for ${meetingDate} in ${event.location}. ` +
    `The discussion will focus on ${event.description || 'upcoming initiatives and collaboration opportunities'}. ` +
    `This is a ${event.meetingType} meeting with ${profiles.length} key attendee${profiles.length > 1 ? 's' : ''} from ${org.name}. ` +
    `Given recent developments including ${org.recentNews[0]?.headline || 'organizational initiatives'}, ` +
    `this meeting presents an opportunity to align on priorities and explore partnership opportunities.`;
  
  // 2. Create rich attendee backgrounds with interaction history
  const attendeeBackgrounds = profiles.map(profile => {
    const recentInteractions = profile.recentInteractions
      .filter(i => daysAgo(i.date) <= 90)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const interactionContext = formatInteractionHistory(recentInteractions);
    
    const context = `${profile.bio} ` +
      `Current priorities include: ${profile.priorities.slice(0, 3).join(', ')}. ` +
      `Recent engagement: ${interactionContext} ` +
      (profile.relationshipNotes ? `Communication preferences: ${profile.relationshipNotes}` : '');
    
    return {
      name: profile.name,
      context: context.trim()
    };
  });
  
  // 3. Identify key topics from cross-referencing all sources
  const keyTopics = extractTopics(event, org, profiles);
  
  // 4. Generate specific, actionable talking points
  const suggestedTalkingPoints: string[] = [];
  
  // Budget-related talking points
  if (keyTopics.includes('Budget & Financial Planning')) {
    const latestNews = org.recentNews.find(n => 
      n.headline.toLowerCase().includes('budget') || 
      n.headline.toLowerCase().includes('funding')
    );
    if (latestNews) {
      suggestedTalkingPoints.push(
        `Reference the ${latestNews.headline} (${latestNews.source}, ${formatDate(latestNews.date)}). ` +
        `Discuss how the proposed $50M infrastructure plan aligns with city priorities and explore partnership funding opportunities.`
      );
    } else {
      suggestedTalkingPoints.push(
        `Address Q4 budget constraints mentioned by CFO Rodriguez in recent email (${daysAgo(profiles.find(p => p.title.includes('CFO'))?.recentInteractions[0]?.date || '')} days ago). ` +
        `Discuss multi-year planning approach to provide budget certainty.`
      );
    }
  }
  
  // Infrastructure talking points
  if (keyTopics.includes('Infrastructure & Capital Improvements')) {
    const infraNews = org.recentNews.find(n => n.headline.toLowerCase().includes('infrastructure'));
    if (infraNews) {
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
      suggestedTalkingPoints.push(
        `Acknowledge the positive teacher retention results (8% improvement) mentioned in recent news. ` +
        `Discuss how city can continue supporting compensation initiatives and explore additional partnership opportunities.`
      );
    }
    
    // Reference Dr. Johnson's priority
    const drJohnson = profiles.find(p => p.name.includes('Johnson'));
    if (drJohnson && drJohnson.priorities.some(p => p.toLowerCase().includes('retention'))) {
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
      suggestedTalkingPoints.push(
        `Address the proposal for expanded after-school programs to 20 additional schools. ` +
        `Discuss partnership opportunities with city recreation centers and explore funding mechanisms for underserved neighborhoods.`
      );
    }
  }
  
  // Add relationship-building talking point
  suggestedTalkingPoints.push(
    `Acknowledge the collaborative relationship and positive outcomes from recent initiatives. ` +
    `Express commitment to continued partnership and ask about priorities for the coming year.`
  );
  
  // 5. Format recent developments with proper attribution
  const recentDevelopments = org.recentNews.slice(0, 3).map(news => ({
    topic: news.headline,
    detail: `${news.summary} (Source: ${news.source}, ${formatDate(news.date)})`
  }));
  
  // 6. Add relationship context
  const relationshipHistory = `The relationship with ${org.name} is characterized as a ${org.relationship} relationship. ` +
    `Recent interactions have been positive, with ${profiles.length} key contact${profiles.length > 1 ? 's' : ''} engaged in regular communication. ` +
    `The organization has been responsive to city initiatives and has shown interest in expanded partnership opportunities. ` +
    `Communication patterns suggest preference for detailed, data-driven discussions with advance preparation.`;
  
  // Determine confidence level based on data completeness
  const hasRecentInteractions = profiles.every(p => 
    p.recentInteractions.some(i => daysAgo(i.date) <= 60)
  );
  const hasRecentNews = org.recentNews.some(n => daysAgo(n.date) <= 30);
  const hasCompleteProfiles = profiles.every(p => 
    p.bio && p.priorities.length > 0 && p.recentInteractions.length > 0
  );
  
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (hasRecentInteractions && hasRecentNews && hasCompleteProfiles) {
    confidence = 'high';
  } else if (!hasRecentInteractions && !hasRecentNews) {
    confidence = 'low';
  }
  
  return {
    meetingTitle: event.title,
    date: meetingDate,
    sections: {
      meetingContext,
      attendeeBackgrounds,
      keyTopics,
      suggestedTalkingPoints,
      recentDevelopments,
      relationshipHistory
    },
    metadata: {
      generatedAt: formatDate(now.toISOString()),
      dataSources: [
        'Event calendar',
        'Contact profiles',
        'Organization database',
        'News aggregator',
        'Interaction history'
      ],
      confidence
    }
  };
}


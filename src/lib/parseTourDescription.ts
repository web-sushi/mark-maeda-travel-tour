/**
 * Tour Description Parser
 * 
 * Parses a single large text block (tours.description) into structured sections.
 * Handles various formatting styles and emojis gracefully.
 */

export interface ParsedSection {
  type: SectionType;
  title: string;
  content: string;
  items?: string[];
  timelineItems?: TimelineItem[];
  metadata?: Record<string, string>;
}

export type SectionType =
  | "overview"
  | "highlights"
  | "duration"
  | "itinerary"
  | "included"
  | "not_included"
  | "what_to_bring"
  | "perfect_for"
  | "meeting_point"
  | "age_restrictions"
  | "important_notes";

export interface TimelineItem {
  time: string;
  description: string;
}

export interface ParsedTourDescription {
  overview?: ParsedSection;
  highlights?: ParsedSection;
  duration?: ParsedSection;
  itinerary?: ParsedSection;
  included?: ParsedSection;
  notIncluded?: ParsedSection;
  whatToBring?: ParsedSection;
  perfectFor?: ParsedSection;
  meetingPoint?: ParsedSection;
  ageRestrictions?: ParsedSection;
  importantNotes?: ParsedSection;
}

/**
 * Section heading patterns (case-insensitive, emoji-tolerant)
 */
const SECTION_PATTERNS: Array<{ type: SectionType; pattern: RegExp }> = [
  { type: "highlights", pattern: /^[🎯✨🌟⭐️]*\s*(?:tour\s+)?highlights?:?$/i },
  { type: "duration", pattern: /^[⏰⏱️🕐]*\s*duration:?$/i },
  { type: "itinerary", pattern: /^[📋🗺️📍]*\s*(?:detailed\s+)?(?:sample\s+)?itinerary:?$/i },
  { type: "included", pattern: /^[✅✔️☑️]*\s*what'?s?\s+included:?$/i },
  { type: "not_included", pattern: /^[❌⛔️🚫]*\s*what'?s?\s+not\s+included:?$/i },
  { type: "what_to_bring", pattern: /^[🎒🧳💼]*\s*what\s+to\s+bring:?$/i },
  { type: "perfect_for", pattern: /^[👥👨‍👩‍👧‍👦💑]*\s*perfect\s+for:?$/i },
  { type: "meeting_point", pattern: /^[📍🚩🗺️]*\s*meeting\s+point:?$/i },
  { type: "age_restrictions", pattern: /^[👶🔞⚠️]*\s*age\s+restrictions?:?$/i },
  { type: "important_notes", pattern: /^[❗️⚠️📌]*\s*important\s+notes?:?$/i },
];

/**
 * Clean up line: remove emoji bullets, extra spaces, leading dashes/bullets
 */
function cleanLine(line: string): string {
  return line
    .trim()
    .replace(/^[•\-*✅❌⭐️🎯✨🌟⏰📋🗺️📍✔️☑️⛔️🚫🎒🧳💼👥👨‍👩‍👧‍👦💑👶🔞⚠️❗️📌]+\s*/, "")
    .trim();
}

/**
 * Check if line is a section heading
 */
function getSectionType(line: string): SectionType | null {
  const trimmed = line.trim();
  for (const { type, pattern } of SECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return type;
    }
  }
  return null;
}

/**
 * Parse timeline items (e.g., "08:30 AM - Pick-up from hotel")
 */
function parseTimelineItem(line: string): TimelineItem | null {
  // Match patterns like "08:30 AM - Description" or "09:00-10:15 AM Description"
  const timePatterns = [
    /^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—]\s*(.+)$/i,
    /^(\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+(.+)$/i,
  ];

  for (const pattern of timePatterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        time: match[1].trim(),
        description: match[2].trim(),
      };
    }
  }

  return null;
}

/**
 * Parse bullet list items
 */
function parseBulletList(content: string): string[] {
  const lines = content.split("\n");
  const items: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cleaned = cleanLine(trimmed);
    if (cleaned) {
      items.push(cleaned);
    }
  }

  return items;
}

/**
 * Parse itinerary section with timeline
 */
function parseItinerary(content: string): TimelineItem[] {
  const lines = content.split("\n");
  const items: TimelineItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const timelineItem = parseTimelineItem(trimmed);
    if (timelineItem) {
      items.push(timelineItem);
    } else {
      // If no time pattern, treat as regular description
      const cleaned = cleanLine(trimmed);
      if (cleaned) {
        items.push({ time: "", description: cleaned });
      }
    }
  }

  return items;
}

/**
 * Parse tags/chips (e.g., "Perfect For" section)
 */
function parseChips(content: string): string[] {
  // Split by commas, newlines, or bullet points
  const items = content
    .split(/[,\n]/)
    .map((item) => cleanLine(item))
    .filter(Boolean);
  
  return items;
}

/**
 * Main parser function
 */
export function parseTourDescription(description: string): ParsedTourDescription {
  if (!description || !description.trim()) {
    return {};
  }

  const lines = description.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentContent: string[] = [];
  let overviewLines: string[] = [];
  let hasFoundFirstHeading = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      if (currentContent.length > 0) {
        currentContent.push("");
      }
      continue;
    }

    // Check if this is a section heading
    const sectionType = getSectionType(trimmed);

    if (sectionType) {
      hasFoundFirstHeading = true;

      // Save previous section
      if (currentSection && currentContent.length > 0) {
        currentSection.content = currentContent.join("\n").trim();
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        type: sectionType,
        title: cleanLine(trimmed.replace(/:$/, "")),
        content: "",
      };
      currentContent = [];
    } else {
      // Add to current section or overview
      if (!hasFoundFirstHeading) {
        overviewLines.push(trimmed);
      } else if (currentSection) {
        currentContent.push(trimmed);
      }
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    currentSection.content = currentContent.join("\n").trim();
    sections.push(currentSection);
  }

  // Process sections based on type
  const result: ParsedTourDescription = {};

  // Add overview if exists
  if (overviewLines.length > 0) {
    result.overview = {
      type: "overview",
      title: "Overview",
      content: overviewLines.join("\n").trim(),
    };
  }

  // Process each section
  for (const section of sections) {
    const processed = { ...section };

    switch (section.type) {
      case "highlights":
        processed.items = parseBulletList(section.content);
        result.highlights = processed;
        break;

      case "duration":
        // Keep as simple text
        result.duration = processed;
        break;

      case "itinerary":
        processed.timelineItems = parseItinerary(section.content);
        result.itinerary = processed;
        break;

      case "included":
        processed.items = parseBulletList(section.content);
        result.included = processed;
        break;

      case "not_included":
        processed.items = parseBulletList(section.content);
        result.notIncluded = processed;
        break;

      case "what_to_bring":
        processed.items = parseBulletList(section.content);
        result.whatToBring = processed;
        break;

      case "perfect_for":
        processed.items = parseChips(section.content);
        result.perfectFor = processed;
        break;

      case "meeting_point":
        result.meetingPoint = processed;
        break;

      case "age_restrictions":
        result.ageRestrictions = processed;
        break;

      case "important_notes":
        processed.items = parseBulletList(section.content);
        result.importantNotes = processed;
        break;
    }
  }

  return result;
}

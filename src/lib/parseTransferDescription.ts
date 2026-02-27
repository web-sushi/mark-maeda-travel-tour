/**
 * Parser for transfer descriptions
 * Splits markdown content into sections based on headings
 */

export interface TransferSection {
  title: string;
  content: string;
  type: 'overview' | 'included' | 'pickup' | 'travel_time' | 'dropoff' | 'important' | 'general';
}

/**
 * Parse transfer description into sections
 * Detects markdown headings and splits content accordingly
 */
export function parseTransferDescription(description: string): TransferSection[] {
  if (!description || !description.trim()) {
    return [];
  }

  const sections: TransferSection[] = [];
  
  // Check if description contains markdown headings
  const hasHeadings = /^#{1,6}\s+/m.test(description);
  
  if (!hasHeadings) {
    // No headings found - return as single overview section
    return [{
      title: 'About This Transfer',
      content: description.trim(),
      type: 'overview'
    }];
  }

  // Split by markdown headings (## or ###)
  const lines = description.split('\n');
  let currentSection: TransferSection | null = null;
  let contentBuffer: string[] = [];

  // Process content before first heading as overview
  const firstHeadingIndex = lines.findIndex(line => /^#{1,6}\s+/.test(line));
  if (firstHeadingIndex > 0) {
    const overviewContent = lines.slice(0, firstHeadingIndex).join('\n').trim();
    if (overviewContent) {
      sections.push({
        title: 'About This Transfer',
        content: overviewContent,
        type: 'overview'
      });
    }
  }

  for (let i = firstHeadingIndex >= 0 ? firstHeadingIndex : 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section if exists
      if (currentSection && contentBuffer.length > 0) {
        currentSection.content = contentBuffer.join('\n').trim();
        
        // Filter out pricing sections
        if (!isPricingSection(currentSection)) {
          sections.push(currentSection);
        }
        contentBuffer = [];
      }

      // Start new section
      const headingText = headingMatch[2].trim();
      const sectionType = detectSectionType(headingText);
      
      currentSection = {
        title: headingText,
        content: '',
        type: sectionType
      };
    } else {
      // Accumulate content for current section
      contentBuffer.push(line);
    }
  }

  // Save last section
  if (currentSection && contentBuffer.length > 0) {
    currentSection.content = contentBuffer.join('\n').trim();
    if (!isPricingSection(currentSection)) {
      sections.push(currentSection);
    }
  }

  // Filter out empty sections
  return sections.filter(section => section.content.length > 0);
}

/**
 * Detect section type based on heading text
 */
function detectSectionType(heading: string): TransferSection['type'] {
  const lower = heading.toLowerCase();

  // Overview patterns
  if (lower.includes('overview') || lower.includes('about this transfer') || lower.includes('about')) {
    return 'overview';
  }

  // What's Included patterns
  if (lower.includes("what's included") || lower.includes('included') || lower.includes('features')) {
    return 'included';
  }

  // Pickup Process patterns
  if (lower.includes('pickup') || lower.includes('meet') || lower.includes('greet') || lower.includes('process')) {
    return 'pickup';
  }

  // Travel Time patterns
  if (lower.includes('travel time') || lower.includes('journey time') || lower.includes('estimated time') || lower.includes('duration')) {
    return 'travel_time';
  }

  // Drop-off zones patterns
  if (lower.includes('drop-off') || lower.includes('dropoff') || lower.includes('zones') || lower.includes('destinations')) {
    return 'dropoff';
  }

  // Important notes patterns
  if (lower.includes('important') || lower.includes('note') || lower.includes('reminder') || lower.includes('attention')) {
    return 'important';
  }

  return 'general';
}

/**
 * Check if section is about pricing/vehicle rates
 * These should be filtered out as they appear in the booking widget
 */
function isPricingSection(section: TransferSection): boolean {
  const lower = section.title.toLowerCase();
  const contentLower = section.content.toLowerCase();

  // Check title for pricing keywords
  if (
    lower.includes('vehicle pricing') ||
    lower.includes('price') ||
    lower.includes('rates') ||
    lower.includes('cost')
  ) {
    return true;
  }

  // Check if content contains multiple price lines
  const priceLineCount = (section.content.match(/¥\d{1,3}(,\d{3})*/g) || []).length;
  if (priceLineCount >= 2) {
    // Likely a pricing table
    return true;
  }

  return false;
}

/**
 * Remove price lines from content
 * Filters out lines that look like "Vehicle Type: ¥XX,XXX"
 */
export function removePriceLines(content: string): string {
  const lines = content.split('\n');
  const filtered = lines.filter(line => {
    const lower = line.toLowerCase();
    
    // Skip lines that contain price patterns
    if (/¥\s*\d{1,3}(,\d{3})*/.test(line)) {
      // But keep if it's in a sentence context (not a price list)
      if (lower.includes('starting from') || lower.includes('total fare') || lower.includes('approximately')) {
        return true;
      }
      // Filter out if it looks like a price list item
      if (/^[-*•]\s*.*¥/.test(line) || /\d+-seater.*¥/.test(line.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
  
  return filtered.join('\n');
}

/**
 * Get icon for section type
 */
export function getSectionIcon(type: TransferSection['type']): string {
  const iconMap: Record<TransferSection['type'], string> = {
    overview: '🚐',
    included: '✅',
    pickup: '🤝',
    travel_time: '⏰',
    dropoff: '📍',
    important: '⚠️',
    general: '📋'
  };

  return iconMap[type];
}

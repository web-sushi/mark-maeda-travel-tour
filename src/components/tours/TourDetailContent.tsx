interface Section {
  title: string;
  content: string[];
}

interface TourDetailContentProps {
  description: string;
  highlights?: string[];
}

/**
 * Parse description text into sections if it contains recognizable headings
 */
function parseDescriptionSections(description: string): Section[] | null {
  const sectionPatterns = [
    /Tour Highlights?:/i,
    /What Makes This Tour Special:/i,
    /Perfect For:/i,
    /Important to Know:/i,
    /What'?s Included:/i,
    /Not Included:/i,
    /Overview:/i,
    /About:/i,
  ];

  // Check if description contains any section headings
  const hasSections = sectionPatterns.some((pattern) =>
    pattern.test(description)
  );

  if (!hasSections) return null;

  const sections: Section[] = [];
  const lines = description.split("\n");
  let currentSection: Section | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section heading
    const isHeading = sectionPatterns.some((pattern) => pattern.test(trimmed));

    if (isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.replace(/:$/, ""),
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : null;
}

export default function TourDetailContent({
  description,
  highlights = [],
}: TourDetailContentProps) {
  const sections = description ? parseDescriptionSections(description) : null;

  return (
    <div className="space-y-8">
      {/* Highlights (from DB highlights field) */}
      {highlights.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Highlights</h2>
          <ul className="space-y-3">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Description - either as sections or paragraphs */}
      {description && (
        <>
          {sections ? (
            // Render as sections
            sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {section.title}
                </h2>
                {section.content.length > 0 && (
                  <ul className="space-y-2">
                    {section.content.map((item, i) => {
                      const isBullet =
                        item.startsWith("•") ||
                        item.startsWith("-") ||
                        item.startsWith("*");
                      const cleanItem = isBullet ? item.substring(1).trim() : item;

                      return (
                        <li
                          key={i}
                          className={`text-gray-700 leading-relaxed ${
                            isBullet ? "flex items-start gap-2" : ""
                          }`}
                        >
                          {isBullet && (
                            <span className="text-gray-400 mt-1">•</span>
                          )}
                          <span>{cleanItem}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))
          ) : (
            // Render as paragraphs
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <div className="prose max-w-none">
                {description.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

import { parseTourDescription } from "@/lib/parseTourDescription";
import Section from "./Section";
import Checklist from "./Checklist";
import Timeline from "./Timeline";
import Chips from "./Chips";
import Accordion from "./Accordion";

interface TourDescriptionProps {
  description: string;
  importantNotes?: string | null;
}

/**
 * Renders all sections from tours.description in a structured Klook-style layout
 */
export default function TourDescription({
  description,
  importantNotes,
}: TourDescriptionProps) {
  const parsed = parseTourDescription(description);

  return (
    <div className="space-y-6">
      {/* Overview */}
      {parsed.overview && (
        <Section title="About This Tour" icon="📖">
          <div className="prose max-w-none">
            {parsed.overview.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Highlights */}
      {parsed.highlights && parsed.highlights.items && (
        <Section title={parsed.highlights.title} icon="✨">
          <Checklist items={parsed.highlights.items} variant="included" />
        </Section>
      )}

      {/* Duration */}
      {parsed.duration && (
        <Section title={parsed.duration.title} icon="⏰">
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-lg">
              {parsed.duration.content}
            </span>
          </div>
        </Section>
      )}

      {/* Itinerary */}
      {parsed.itinerary && parsed.itinerary.timelineItems && (
        <Section title={parsed.itinerary.title} icon="🗺️">
          <Timeline items={parsed.itinerary.timelineItems} />
        </Section>
      )}

      {/* What's Included */}
      {parsed.included && parsed.included.items && (
        <Section title={parsed.included.title} icon="✅">
          <Checklist items={parsed.included.items} variant="included" />
        </Section>
      )}

      {/* What's NOT Included */}
      {parsed.notIncluded && parsed.notIncluded.items && (
        <Section title={parsed.notIncluded.title} icon="❌">
          <Checklist items={parsed.notIncluded.items} variant="excluded" />
        </Section>
      )}

      {/* What to Bring */}
      {parsed.whatToBring && parsed.whatToBring.items && (
        <Section title={parsed.whatToBring.title} icon="🎒">
          <Checklist items={parsed.whatToBring.items} variant="included" />
        </Section>
      )}

      {/* Perfect For */}
      {parsed.perfectFor && parsed.perfectFor.items && (
        <Section title={parsed.perfectFor.title} icon="👥">
          <Chips items={parsed.perfectFor.items} />
        </Section>
      )}

      {/* Meeting Point */}
      {parsed.meetingPoint && (
        <Section title={parsed.meetingPoint.title} icon="📍">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-gray-700 leading-relaxed">
              {parsed.meetingPoint.content}
            </p>
          </div>
        </Section>
      )}

      {/* Age Restrictions */}
      {parsed.ageRestrictions && (
        <Section title={parsed.ageRestrictions.title} icon="👶">
          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <svg
              className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-gray-700 leading-relaxed">
              {parsed.ageRestrictions.content}
            </p>
          </div>
        </Section>
      )}

      {/* Important Notes */}
      {(parsed.importantNotes || importantNotes) && (
        <Accordion
          title="Important Notes"
          items={parsed.importantNotes?.items}
          content={
            !parsed.importantNotes?.items
              ? parsed.importantNotes?.content || importantNotes || undefined
              : undefined
          }
          defaultOpen={false}
        />
      )}
    </div>
  );
}

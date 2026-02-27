import { TimelineItem as TimelineItemType } from "@/lib/parseTourDescription";

interface TimelineProps {
  items: TimelineItemType[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative space-y-6">
      {/* Vertical line */}
      <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300" />

      {items.map((item, index) => (
        <div key={index} className="relative flex gap-4">
          {/* Timeline dot */}
          <div className="relative z-10 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-semibold shadow-lg">
              {index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pt-0.5">
            {item.time && (
              <div className="text-sm font-semibold text-blue-600 mb-1">
                {item.time}
              </div>
            )}
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

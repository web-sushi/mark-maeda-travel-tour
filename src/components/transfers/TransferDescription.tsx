import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseTransferDescription, getSectionIcon, removePriceLines } from "@/lib/parseTransferDescription";

interface TransferDescriptionProps {
  description: string;
  notes?: string | null;
}

/**
 * Renders transfer description with multiple section cards
 * Parses markdown by headings and displays each section separately
 * Matches Tour page UI style
 */
export default function TransferDescription({
  description,
  notes,
}: TransferDescriptionProps) {
  if (!description && !notes) return null;

  // Parse description into sections
  const sections = description ? parseTransferDescription(description) : [];

  return (
    <div className="space-y-6">
      {/* Render each section as a separate card */}
      {sections.map((section, index) => {
        const icon = getSectionIcon(section.type);
        const isImportant = section.type === 'important';
        
        // Remove price lines from content
        const cleanContent = removePriceLines(section.content);
        
        if (!cleanContent.trim()) return null;

        return (
          <section
            key={index}
            className={`bg-white rounded-xl border p-6 shadow-sm ${
              isImportant 
                ? 'border-amber-300 bg-amber-50' 
                : 'border-gray-200'
            }`}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{icon}</div>
              <h2 className="text-2xl font-bold text-gray-900">
                {section.title}
              </h2>
            </div>

            {/* Section Content */}
            <div
              className={`prose prose-lg max-w-none 
                prose-headings:font-bold prose-headings:text-gray-900 
                prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 
                prose-h4:text-base prose-h4:mt-3 prose-h4:mb-2
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 
                prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6 
                prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6 
                prose-li:my-1.5 prose-li:text-gray-700 prose-li:leading-relaxed
                prose-strong:font-semibold prose-strong:text-gray-900 
                prose-em:italic 
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline 
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 
                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800 prose-code:before:content-[''] prose-code:after:content-['']
                ${isImportant ? 'prose-p:text-gray-800 prose-li:text-gray-800' : ''}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanContent}
              </ReactMarkdown>
            </div>
          </section>
        );
      })}

      {/* Separate Important Notes Section (if provided in notes field) */}
      {notes && (
        <section className="bg-white rounded-xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900">Important Notes</h2>
          </div>

          <div className="prose max-w-none prose-p:text-gray-800 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-li:text-gray-800 prose-strong:font-semibold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notes}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}

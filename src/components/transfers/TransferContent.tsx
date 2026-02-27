import ReactMarkdown from "react-markdown";

interface TransferContentProps {
  description: string;
  notes?: string | null;
}

/**
 * Renders transfer description using Markdown
 * Supports headings, bold, italic, lists, etc.
 */
export default function TransferContent({
  description,
  notes,
}: TransferContentProps) {
  return (
    <div className="space-y-8">
      {/* Description rendered as Markdown */}
      {description && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Transfer</h2>
          <div className="prose max-w-none prose-p:leading-relaxed prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-strong:font-semibold prose-strong:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>
              {description || "No description provided."}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Additional notes section */}
      {notes && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Important Notes
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="prose max-w-none prose-p:leading-relaxed prose-p:text-gray-700 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-strong:font-semibold">
              <ReactMarkdown>
                {notes}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

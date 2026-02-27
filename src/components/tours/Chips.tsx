interface ChipsProps {
  items: string[];
}

export default function Chips({ items }: ChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200 shadow-sm"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

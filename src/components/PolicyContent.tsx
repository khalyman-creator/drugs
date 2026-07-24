type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string };

function parsePolicyText(raw: string): Block[] {
  return raw
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith("## ")
        ? { type: "heading" as const, text: chunk.slice(3).trim() }
        : { type: "paragraph" as const, text: chunk }
    );
}

export function PolicyContent({ text }: { text: string }) {
  const blocks = parsePolicyText(text);

  return (
    <div className="mt-8 space-y-4 text-gray-700">
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <h2 key={i} className="font-display pt-4 text-lg uppercase tracking-wide text-gray-900 first:pt-0">
            {block.text}
          </h2>
        ) : (
          <p key={i} className="leading-relaxed">
            {block.text}
          </p>
        )
      )}
    </div>
  );
}

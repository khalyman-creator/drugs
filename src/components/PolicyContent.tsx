type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string };

function parsePolicyText(raw: string): Block[] {
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const text = paragraphLines.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraphLines = [];
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
    } else if (trimmed === "") {
      flushParagraph();
    } else {
      paragraphLines.push(trimmed);
    }
  }
  flushParagraph();

  return blocks;
}

export function PolicyContent({ text }: { text: string }) {
  const blocks = parsePolicyText(text);

  return (
    <div className="mt-8 space-y-4 text-gray-700">
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <h2 key={i} className="font-display pt-4 text-lg font-bold text-gray-900 first:pt-0">
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

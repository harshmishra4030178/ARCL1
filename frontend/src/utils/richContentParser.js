/**
 * Universal Rich Content & Markdown Parser for ARCL Instruments
 * Ensures paragraphs, copied content, headings, lists, tables, and formatting
 * render with 100% fidelity on the frontend.
 */

export function parseRichContentToHtml(rawContent) {
  if (!rawContent || typeof rawContent !== "string") return "";

  let content = rawContent.trim();

  // If content is already pure rich HTML (starts with HTML tags), return as is with styling classes
  const isHtml = /<[a-z][\s\S]*>/i.test(content) && (content.includes("<p>") || content.includes("<div>") || content.includes("<h2>") || content.includes("<table>"));
  if (isHtml) {
    return content;
  }

  // Standardize line endings (\r\n -> \n)
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Helper to parse inline styles (bold, italic, code, links)
  const parseInline = (text) => {
    return text
      // Bold + Italic (***text*** or ___text___)
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic text-slate-900">$1</strong>')
      .replace(/___(.*?)___/g, '<strong class="font-bold italic text-slate-900">$1</strong>')
      // Bold (**text** or __text__)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900">$1</strong>')
      // Italic (*text* or _text_)
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
      .replace(/_([^_]+)_/g, '<em class="italic text-slate-800">$1</em>')
      // Inline Code (`code`)
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-amber-700 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200">$1</code>')
      // Links ([text](url))
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2">$1</a>');
  };

  // Split content into blocks separated by blank lines (2 or more \n)
  const rawBlocks = content.split(/\n\s*\n+/);
  const parsedBlocks = [];

  for (let block of rawBlocks) {
    block = block.trim();
    if (!block) continue;

    // 1. Horizontal Rule (--- or ***)
    if (/^(\-{3,}|\*{3,})$/.test(block)) {
      parsedBlocks.push('<hr class="my-8 border-slate-200" />');
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (/^#{1,6}\s+/.test(block)) {
      const headingMatch = block.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const inlineText = parseInline(text);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        if (level === 1) {
          parsedBlocks.push(`<h1 id="${id}" class="text-2xl sm:text-3xl font-black text-slate-900 mt-8 mb-4 tracking-tight leading-snug">${inlineText}</h1>`);
        } else if (level === 2) {
          parsedBlocks.push(`<h2 id="${id}" class="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-100 tracking-tight leading-snug">${inlineText}</h2>`);
        } else if (level === 3) {
          parsedBlocks.push(`<h3 id="${id}" class="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-3 leading-snug">${inlineText}</h3>`);
        } else {
          parsedBlocks.push(`<h4 id="${id}" class="text-base font-bold text-slate-800 mt-4 mb-2 leading-snug">${inlineText}</h4>`);
        }
        continue;
      }
    }

    // 3. Blockquote (> text)
    if (block.startsWith(">")) {
      const quoteText = block
        .split("\n")
        .map((line) => line.replace(/^>\s?/, "").trim())
        .join("<br />");
      parsedBlocks.push(
        `<blockquote class="border-l-4 border-amber-500 bg-amber-50/60 p-4 sm:p-5 rounded-r-2xl my-5 text-slate-800 text-sm sm:text-base font-medium leading-relaxed shadow-2xs">${parseInline(quoteText)}</blockquote>`
      );
      continue;
    }

    // 4. Code Block (```code```)
    if (block.startsWith("```")) {
      const codeLines = block.split("\n");
      const language = codeLines[0].replace(/^```/, "").trim();
      const codeBody = codeLines.slice(1, -1).join("\n");
      parsedBlocks.push(
        `<pre class="bg-slate-950 text-amber-300 p-4 sm:p-5 rounded-2xl font-mono text-xs sm:text-sm overflow-x-auto my-5 border border-slate-800 shadow-inner"><code>${codeBody}</code></pre>`
      );
      continue;
    }

    // 5. Unordered List (lines starting with -, *, •)
    const isUnorderedList = block.split("\n").every((line) => /^[-*•+]\s+/.test(line.trim()));
    if (isUnorderedList) {
      const items = block
        .split("\n")
        .map((line) => line.trim().replace(/^[-*•+]\s+/, ""))
        .filter(Boolean)
        .map((item) => `<li class="leading-relaxed">${parseInline(item)}</li>`)
        .join("");
      parsedBlocks.push(`<ul class="list-disc pl-6 space-y-2 my-4 text-slate-700 text-sm sm:text-base">${items}</ul>`);
      continue;
    }

    // 6. Ordered List (lines starting with 1., 2., or 1), 2))
    const isOrderedList = block.split("\n").every((line) => /^\d+[\.\)]\s+/.test(line.trim()));
    if (isOrderedList) {
      const items = block
        .split("\n")
        .map((line) => line.trim().replace(/^\d+[\.\)]\s+/, ""))
        .filter(Boolean)
        .map((item) => `<li class="leading-relaxed pl-1">${parseInline(item)}</li>`)
        .join("");
      parsedBlocks.push(`<ol class="list-decimal pl-6 space-y-2 my-4 text-slate-700 text-sm sm:text-base">${items}</ol>`);
      continue;
    }

    // 7. Markdown Table (lines with |)
    const isTable = block.split("\n").every((line) => line.includes("|"));
    if (isTable) {
      const rows = block.split("\n").map((r) => r.trim()).filter(Boolean);
      if (rows.length >= 2) {
        const headerRow = rows[0].split("|").map((c) => c.trim()).filter(Boolean);
        const bodyRows = rows.slice(rows[1].includes("---") ? 2 : 1);

        const ths = headerRow.map((th) => `<th class="px-4 py-2.5 text-left text-xs font-bold text-slate-900 uppercase tracking-wider bg-slate-100 border border-slate-200">${parseInline(th)}</th>`).join("");
        const trs = bodyRows
          .map((row) => {
            const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
            const tds = cells.map((td) => `<td class="px-4 py-2.5 text-xs sm:text-sm text-slate-700 border border-slate-200">${parseInline(td)}</td>`).join("");
            return `<tr class="hover:bg-slate-50/80 transition">${tds}</tr>`;
          })
          .join("");

        parsedBlocks.push(
          `<div class="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-2xs"><table class="w-full border-collapse bg-white"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
        );
        continue;
      }
    }

    // 8. Standard Paragraph with single line-break preservation
    const paragraphLines = block.split("\n").map((line) => parseInline(line.trim()));
    const paragraphHtml = paragraphLines.join("<br />");
    parsedBlocks.push(`<p class="mb-5 leading-relaxed text-slate-700 text-sm sm:text-base">${paragraphHtml}</p>`);
  }

  return parsedBlocks.join("\n");
}

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code
          key={index}
          className="rounded-sm bg-surface-2 px-1 font-mono text-sm text-fg"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-medium text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function CodeBlock({ source, lang }: { source: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-3 overflow-hidden rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-xs text-subtle">{lang || "text"}</span>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-sm px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg"
          onClick={() => {
            void navigator.clipboard.writeText(source).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-sm leading-relaxed text-fg">
        <code>{source.replace(/\n$/, "")}</code>
      </pre>
    </div>
  );
}

function Prose({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const body = paragraph.join(" ").trim();
    paragraph = [];
    if (!body) return;
    blocks.push(
      <p key={key++} className="text-base leading-relaxed text-fg">
        <Inline text={body} />
      </p>,
    );
  };

  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={key++} className="list-disc space-y-1 pl-5 text-base leading-relaxed text-fg">
        {items.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>,
    );
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1]!.length;
      blocks.push(
        <p
          key={key++}
          className={cn(
            "font-medium tracking-tight text-fg",
            level === 1 ? "text-lg" : "text-base",
          )}
        >
          <Inline text={heading[2]!} />
        </p>,
      );
      continue;
    }
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]!);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();

  return <div className="space-y-3">{blocks}</div>;
}

export function Markdown({ text }: { text: string }) {
  const chunks = text.split("```");
  return (
    <div className="space-y-3">
      {chunks.map((chunk, index) => {
        if (index % 2 === 1) {
          const newline = chunk.indexOf("\n");
          const lang = newline === -1 ? "" : chunk.slice(0, newline).trim();
          const source = newline === -1 ? chunk : chunk.slice(newline + 1);
          return <CodeBlock key={index} lang={lang} source={source} />;
        }
        if (!chunk.trim()) return null;
        return <Prose key={index} text={chunk} />;
      })}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/safe-html";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block", "link"],
  [{ color: [] }, { background: [] }],
  ["clean"],
];

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
  "color",
  "background",
];

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 200,
}: RichTextEditorProps) {
  const safeValue = useMemo(() => sanitizeHtml(value), [value]);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background dark:bg-background shadow-sm transition focus-within:border-[var(--brand-primary,#213928)] focus-within:ring-2 focus-within:ring-[var(--brand-primary,#213928)]/20",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={safeValue}
        onChange={(content) => onChange(sanitizeHtml(content))}
        placeholder={placeholder}
        modules={{
          toolbar: {
            container: TOOLBAR_OPTIONS,
            handlers: {},
          },
        }}
        formats={FORMATS}
        className="rich-quill"
        style={{ minHeight }}
      />
      <style jsx global>{`
        .rich-quill .ql-container {
          font-size: 14px;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rich-quill .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted));
        }
        .rich-quill .ql-editor {
          min-height: ${minHeight}px !important;
          padding: 12px 16px;
          line-height: 1.6;
          color: hsl(var(--foreground));
        }
        .rich-quill .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-quill .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }
        .rich-quill .ql-fill {
          fill: hsl(var(--muted-foreground));
        }
        .rich-quill .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .rich-quill .ql-toolbar button:hover,
        .rich-quill .ql-toolbar button:focus,
        .rich-quill .ql-toolbar button.ql-active {
          color: var(--brand-primary, #213928);
        }
        .rich-quill .ql-toolbar button:hover .ql-stroke,
        .rich-quill .ql-toolbar button:focus .ql-stroke,
        .rich-quill .ql-toolbar button.ql-active .ql-stroke {
          stroke: var(--brand-primary, #213928);
        }
        .rich-quill .ql-toolbar button:hover .ql-fill,
        .rich-quill .ql-toolbar button:focus .ql-fill,
        .rich-quill .ql-toolbar button.ql-active .ql-fill {
          fill: var(--brand-primary, #213928);
        }
        .dark .rich-quill .ql-toolbar {
          background: hsl(var(--muted));
          border-bottom-color: hsl(var(--border));
        }
        .dark .rich-quill .ql-container {
          background: hsl(var(--background));
        }
        .dark .rich-quill .ql-editor {
          color: hsl(var(--foreground));
        }
        .dark .rich-quill .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }
        .dark .rich-quill .ql-fill {
          fill: hsl(var(--muted-foreground));
        }
        .dark .rich-quill .ql-picker-label {
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/safe-html";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "link"],
  ["clean"],
];

const FORMATS = ["header", "bold", "italic", "underline", "list", "bullet", "blockquote", "link"];

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
  minHeight = 500,
}: RichTextEditorProps) {
  const safeValue = useMemo(() => sanitizeHtml(value), [value]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background shadow-inner transition focus-within:border-[var(--brand-primary,#2563eb)]",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={safeValue}
        onChange={(content) => onChange(sanitizeHtml(content))}
        placeholder={placeholder}
        modules={{
          toolbar: TOOLBAR_OPTIONS,
        }}
        formats={FORMATS}
        className="rich-quill"
        style={{ minHeight }}
      />
      <style jsx>{`
       .ql-container .ql-editor {
          min-height:${minHeight}px !important;
        }
      `}</style>
    </div>
  );
}

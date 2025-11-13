"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor";
import "@uiw/react-markdown-preview";

const Editor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  height = 220,
}: MarkdownEditorProps) {
  const safeValue = useMemo(() => value ?? "", [value]);

  return (
    <div
      data-color-mode="light"
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/70 bg-background shadow-inner",
        className
      )}
    >
      <Editor
        value={safeValue}
        height={height}
        onChange={(next) => onChange(next ?? "")}
        preview="edit"
        textareaProps={{
          placeholder,
        }}
        visibleDragbar={false}
        className="bg-transparent"
      />
    </div>
  );
}

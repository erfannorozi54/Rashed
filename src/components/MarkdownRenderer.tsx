"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-[var(--foreground)] prose-a:text-[var(--primary-600)] prose-strong:text-[var(--foreground)] prose-code:text-[var(--primary-600)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--muted)] prose-pre:border prose-pre:border-[var(--border)]">
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

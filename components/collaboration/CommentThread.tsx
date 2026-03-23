"use client";

import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  anchorLabel?: string;
}

export function CommentThread({
  comments,
  onAddComment,
  anchorLabel,
}: CommentThreadProps) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim()) {
      onAddComment(text.trim());
      setText("");
    }
  }

  return (
    <div className="border border-border rounded-lg bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
      >
        <span className="text-muted-foreground">
          {anchorLabel && <span className="font-medium text-foreground mr-1">{anchorLabel}</span>}
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{c.author}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-foreground">{c.text}</p>
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex gap-1.5 pt-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { PREDEFINED_TAGS } from "@/lib/tags";

type SortMode = "random" | "newest" | "oldest";

interface TagFilterModalProps {
  selectedTags: string[];
  sortMode: SortMode;
  tagCounts: Record<string, number>;
  onApply: (tags: string[], sort: SortMode) => void;
}

export default function TagFilterModal({ selectedTags, sortMode, tagCounts, onApply }: TagFilterModalProps) {
  const [open, setOpen] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>(selectedTags);
  const [localSort, setLocalSort] = useState<SortMode>(sortMode);

  useEffect(() => {
    setLocalTags(selectedTags);
    setLocalSort(sortMode);
  }, [selectedTags, sortMode]);

  const toggle = (tag: string) => {
    setLocalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleApply = () => {
    onApply(localTags, localSort);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalTags([]);
  };

  const availableTags = PREDEFINED_TAGS.filter((tag) => (tagCounts[tag] ?? 0) > 0);

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "random", label: "random" },
    { value: "newest", label: "newest" },
    { value: "oldest", label: "oldest" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="filter-fab"
        aria-label="Open filters"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        {selectedTags.length > 0 && (
          <span className="filter-badge">{selectedTags.length}</span>
        )}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="filter-modal">
          <div className="filter-modal-header">
            <span className="filter-modal-title">filter & sort</span>
            <button className="filter-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Sort section */}
          <div className="filter-section-label">sort</div>
          <div className="filter-sort-row">
            {sortOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLocalSort(value)}
                className={`filter-sort-btn ${localSort === value ? "selected" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tags section */}
          <div className="filter-section-label">tags</div>
          <div className="filter-tags-grid">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className={`filter-tag ${localTags.includes(tag) ? "selected" : ""}`}
              >
                {tag}
                <span className="filter-tag-count">{tagCounts[tag]}</span>
              </button>
            ))}
          </div>

          <div className="filter-modal-footer">
            <button className="filter-clear-btn" onClick={handleClear} disabled={localTags.length === 0}>
              clear
            </button>
            <button className="filter-apply-btn" onClick={handleApply}>
              apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}
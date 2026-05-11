"use client";

import { useState, useEffect } from "react";
import { PREDEFINED_TAGS } from "@/lib/tags";
import "../../app/styles/videos.css"

type SortMode = "random" | "newest" | "oldest";

interface TagFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  sortMode: SortMode;
  tagCounts: Record<string, number>;
  onApply: (tags: string[], sort: SortMode) => void;
}

export default function TagFilterModal({
  isOpen,
  onClose,
  selectedTags,
  sortMode,
  tagCounts,
  onApply,
}: TagFilterModalProps) {
  const [localTags, setLocalTags] = useState<string[]>(selectedTags);
  const [localSort, setLocalSort] = useState<SortMode>(sortMode);

  useEffect(() => {
    setLocalTags(selectedTags);
    setLocalSort(sortMode);
  }, [selectedTags, sortMode]);

  if (!isOpen) return null;

  const toggle = (tag: string) => {
    setLocalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleApply = () => {
    onApply(localTags, localSort);
    onClose();
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
      <div className="modal-backdrop" onClick={onClose} />

      <div className="filter-modal">
        <div className="filter-modal-header">
          <span className="filter-modal-title">filter & sort</span>
          <button className="filter-modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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
          <button
            className="filter-clear-btn"
            onClick={handleClear}
            disabled={localTags.length === 0}
          >
            clear
          </button>
          <button className="filter-apply-btn" onClick={handleApply}>
            apply
          </button>
        </div>
      </div>
    </>
  );
}
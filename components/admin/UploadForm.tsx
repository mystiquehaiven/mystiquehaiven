"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebase";

// Replace with your real tags when ready
const PREDEFINED_TAGS = [
  "Blonde",
  "Brunette",
  "Redhead",
  "Black Hair",
  "Colored Hair",
  "Big Boobs",
  "Anime",
  "Realistic",
  "Sex",
  "Blowjob",
  "Deepthroat",
  "Missionary",
  "Doggy",
  "Cowgirl",
  "Reverse Cowgirl",
  "Prone",
  "Nude",
  "Topless",
  "Bottomless",
  "Stripping",
  "Public",
  "Forest",
  "Grocery Store",
  "Bar",
  "Dancing",
  "Alien",
  "Sci-Fi",
  "Fantasy",
  "Medievel",
  "Bikini",
  "Beach",
  "Lingerie",
  "Shower",
  "Gym",
  "Sundress",
  "Panties",
  "Tail",
  "Cat-Girl",
  "Skirt",
  "Lesbian",
  "Clones",
  "Submissive",
  "Handjob",
  "Titfuck",
  "Magic",
  "Thong",
  "Bunny-Girl",
  "Leather",
  "Pool",
  "Festival",
  "Cumshot",
  "Cum",
  "Masturbating",
  "Fingering",
  "Strap-On",
  "Dildo",
  "Demon",
  "Angel",
  "Threesome",
  "Cyberpunk",
  "Elf",
  "Fairy",
  "Black and White",
  "With Sound",
  "Softcore",
  "Hardcore",
  "Park",
  "Ass",
  "Pussy",
  "Socks",
  "Leggings",
  "Corset",
  "Goddess",
  "Tattoos",
  "Nipples Pierced",
  "Wings",
  "Booty Shorts",
  "Emo",
  "Goth",


];

export default function UploadForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Title and file are required.");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Force token refresh to ensure latest claims
      const token = await user.getIdToken(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tags", JSON.stringify(selectedTags));

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setSelectedTags([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="upload-form">
      <h2 className="form-heading">Upload Video</h2>


      <div className="field">
        <label className="label">Tags</label>
        <div className="tag-grid">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`tag-btn ${selectedTags.includes(tag) ? "tag-btn--active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label">Video File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="file-input"
        />
        {file && (
          <p className="file-name">{file.name}</p>
        )}
      </div>

      {errorMsg && <p className="error-msg">{errorMsg}</p>}

      {status === "success" && (
        <p className="success-msg">Video uploaded successfully.</p>
      )}

      <button
        onClick={handleUpload}
        disabled={status === "uploading"}
        className="upload-btn"
      >
        {status === "uploading" ? "Uploading..." : "Upload"}
      </button>

      <style jsx>{`
        .upload-form {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 2rem;
          max-width: 560px;
          width: 100%;
        }
        .form-heading {
          font-size: 1.1rem;
          font-weight: 500;
          color: #e8e8e8;
          margin: 0 0 1.5rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .field {
          margin-bottom: 1.25rem;
        }
        .label {
          display: block;
          font-size: 0.75rem;
          color: #666;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .input {
          width: 100%;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 0.6rem 0.75rem;
          color: #e8e8e8;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .input:focus {
          border-color: #555;
        }
        .tag-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag-btn {
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          padding: 0.35rem 0.75rem;
          color: #888;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .tag-btn:hover {
          border-color: #444;
          color: #bbb;
        }
        .tag-btn--active {
          background: #1a1a1a;
          border-color: #888;
          color: #e8e8e8;
        }
        .file-input {
          color: #888;
          font-size: 0.85rem;
          width: 100%;
        }
        .file-name {
          margin: 0.5rem 0 0;
          font-size: 0.8rem;
          color: #666;
        }
        .error-msg {
          font-size: 0.82rem;
          color: #c0392b;
          margin: 0 0 1rem;
        }
        .success-msg {
          font-size: 0.82rem;
          color: #27ae60;
          margin: 0 0 1rem;
        }
        .upload-btn {
          background: #e8e8e8;
          color: #0d0d0d;
          border: none;
          border-radius: 6px;
          padding: 0.65rem 1.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          letter-spacing: 0.04em;
        }
        .upload-btn:hover {
          background: #fff;
        }
        .upload-btn:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
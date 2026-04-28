"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import UploadForm from "@/components/admin/UploadForm";
import Link from "next/link";
import Navbar from "@/components/Navbar";


export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});


  

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    if (!u) {
      router.replace("/signin");
      return;
    }
    const tokenResult = await u.getIdTokenResult();
    if (!tokenResult.claims.admin) {
      router.replace("/");
      return;
    }

    const token = await u.getIdToken();
    const res = await fetch("/api/admin/tag-counts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTagCounts(data.counts);
    }

    setUser(u);
    setIsAdmin(true);
    setLoading(false);
  });

  return () => unsubscribe();
}, [router]);



  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-dot" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="page">
      <Navbar />

      <main className="main">
        <div className="profile-header">
          {user?.photoURL && (
            <img src={user.photoURL} alt="Profile" className="avatar" />
          )}
          <div>
            <h1 className="profile-name">{user?.displayName ?? "Admin"}</h1>
            <span className="admin-badge">Admin</span>
          </div>
        </div>
          


        <UploadForm tagCounts={tagCounts} />
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #080808;
          color: #e8e8e8;
        }
        .nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 2rem;
          border-bottom: 1px solid #1a1a1a;
        }
        .nav-link {
          font-size: 0.85rem;
          color: #888;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: #e8e8e8;
        }
        .nav-profile {
          margin-left: auto;
          font-size: 0.8rem;
          color: #555;
        }
        .main {
          max-width: 640px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #2a2a2a;
        }
        .profile-name {
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 4px;
          color: #e8e8e8;
        }
        .admin-badge {
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
          border: 1px solid #2a2a2a;
          border-radius: 3px;
          padding: 2px 6px;
        }
        .loading-screen {
          min-height: 100vh;
          background: #080808;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loading-dot {
          width: 6px;
          height: 6px;
          background: #444;
          border-radius: 50%;
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

      `}</style>
    </div>
  );
}
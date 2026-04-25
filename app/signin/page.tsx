"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ModalState = "idle" | "age-verify" | "denied";

export default function SignInPage() {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [pendingUser, setPendingUser] = useState<{
    uid: string;
    email: string | null;
  } | null>(null);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user — hold off on Firestore write until age is confirmed
        setPendingUser({ uid: user.uid, email: user.email });
        setModalState("age-verify");
        return;
      }

      // Returning user — existing routing logic
      await routeUser(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAgeConfirmed = async () => {
    if (!pendingUser) return;
    try {
      await setDoc(doc(db, "users", pendingUser.uid), {
        email: pendingUser.email,
        subscriptionStatus: "inactive",
        subscriptionTier: "none", // "none" | "threshold" | "standard" | "exclusive"
        ageVerified: true,
        createdAt: new Date(),
      });
      setModalState("idle");
      router.push("/profile");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAgeDenied = () => {
    setPendingUser(null);
    setModalState("denied");
  };

  const routeUser = async (user: { getIdTokenResult: () => Promise<any> }) => {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin) {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleGoogleSignIn}
        className="px-6 py-3 bg-white text-black border rounded shadow hover:shadow-md"
      >
        Sign in with Google
      </button>

      {/* Age Verification Modal */}
      {modalState === "age-verify" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Age Verification
            </h2>
            <p className="text-gray-600 mb-6">
              This platform contains mature content. You must be 18 or older to
              continue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAgeConfirmed}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                I am 18 or older
              </button>
              <button
                onClick={handleAgeDenied}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                I am under 18
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Denied State */}
      {modalState === "denied" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Restricted
            </h2>
            <p className="text-gray-600">
              You must be 18 or older to use this platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
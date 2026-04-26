"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchTermsContent, getTermsVersionAction } from "@/app/actions/terms";

type ModalState = "idle" | "age-verify" | "tos" | "denied";

export default function SignInPage() {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [pendingUser, setPendingUser] = useState<{
    uid: string;
    email: string | null;
  } | null>(null);
  const [termsHtml, setTermsHtml] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);

  // Load terms when ToS modal opens
  useEffect(() => {
    if (modalState === "tos") {
      fetchTermsContent().then(setTermsHtml);
    }
  }, [modalState]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user — show age verification first
        setPendingUser({ uid: user.uid, email: user.email });
        setModalState("age-verify");
        return;
      }

      // Returning user — check if ToS needs re-acceptance
      const userTosVersion = userSnap.data()?.tosVersion;
      const currentVersion = await getTermsVersionAction();

      if (userTosVersion !== currentVersion) {
        // ToS was updated, require re-acceptance
        setPendingUser({ uid: user.uid, email: user.email });
        setModalState("tos");
        return;
      }

      // All good, route them
      await routeUser(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAgeConfirmed = () => {
    // Age verified, now show ToS
    setTosAccepted(false);
    setModalState("tos");
  };

  const handleAgeDenied = () => {
    setPendingUser(null);
    setTosAccepted(false);
    setModalState("denied");
  };

  const handleTosAccepted = async () => {
    if (!pendingUser) return;
    try {
      const currentVersion = await getTermsVersionAction();
      const isNewUser = !(await getDoc(doc(db, "users", pendingUser.uid))).exists();

      await setDoc(
        doc(db, "users", pendingUser.uid),
        {
          email: pendingUser.email,
          ageVerified: true,
          ageVerifiedAt: new Date(),
          tosAcceptedAt: new Date(),
          tosVersion: currentVersion,
          ...(isNewUser && {
            subscriptionStatus: "inactive",
            subscriptionTier: "none",
            createdAt: new Date(),
          }),
        },
        { merge: true }
      );

      setModalState("idle");
      setTosAccepted(false);

      const user = auth.currentUser;
      if (user) {
        await routeUser(user);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTosDenied = () => {
    setPendingUser(null);
    setTosAccepted(false);
    setModalState("denied");
  };

  const routeUser = async (user: { getIdTokenResult: () => Promise<any> }) => {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin) {
      router.push("/admin");
    } else {
      router.push("/profile");
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

      {/* Terms of Service Modal */}
      {modalState === "tos" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Terms of Service
            </h2>

            {/* Scrollable Terms Content */}
            <div className="flex-1 overflow-y-auto mb-6 pr-4 text-sm text-gray-700 border border-gray-200 rounded p-4">
              {termsHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: termsHtml }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p>Loading terms...</p>
              )}
            </div>

            {/* Checkbox + Buttons */}
            <div className="border-t pt-4">
              <label className="flex items-start gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the Terms of Service
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleTosAccepted}
                  disabled={!tosAccepted}
                  className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Accept and Continue
                </button>
                <button
                  onClick={handleTosDenied}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Decline
                </button>
              </div>
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
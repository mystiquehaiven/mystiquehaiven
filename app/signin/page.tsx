"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";


export default function SignInPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user doc already exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // If not, create it with default role
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          subscriptionStatus: "inactive",
          createdAt: new Date(),
        });
      }

      const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.admin) {
          router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
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
    </div>
  );
}
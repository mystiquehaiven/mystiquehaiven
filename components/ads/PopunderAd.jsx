// app/components/PopunderAd.jsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const MIN_ENGAGEMENT_MS = 3 * 60 * 1000; // require 3 min in-app before eligible
const COOLDOWN_MS = 24 * 60 * 60 * 1000;  // don't refire for 24h

export default function PopunderAd() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);

  // reuse your existing admin gate pattern
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setIsAdmin(false);
      const token = await user.getIdTokenResult();
      setIsAdmin(!!token.claims.admin);
    });
  }, []);

  useEffect(() => {
    if (isAdmin !== false) return; // wait for resolved non-admin

    const lastFired = Number(localStorage.getItem('popunderLastFired') || 0);
    if (Date.now() - lastFired < COOLDOWN_MS) return; // still in cooldown

    const timer = setTimeout(() => {
      setShouldLoad(true);
      localStorage.setItem('popunderLastFired', String(Date.now()));
    }, MIN_ENGAGEMENT_MS);

    return () => clearTimeout(timer);
  }, [isAdmin]);

  if (!shouldLoad) return null;

  return (
    <Script
      src="https://thoroughgear.com/bI3/V.0DPG3YpcvDb/mWVVJHZCDk0/3pMRTHkBxJNOTTUoz_LXTpc/xCOKT_EX1ANtTxch"
      strategy="lazyOnload"
      async
    />
  );
}
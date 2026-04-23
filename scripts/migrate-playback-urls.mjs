// scripts/migrate-playback-urls.mjs
// Run with: node scripts/migrate-playback-urls.mjs

import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../service-account.json");

const BUNNY_CDN_HOSTNAME = "vz-53bf2ade-7e4.b-cdn.net";

if (!BUNNY_CDN_HOSTNAME) {
  console.error("Error: BUNNY_CDN_HOSTNAME env var is not set.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  const snapshot = await db.collection("videos").get();
  const BATCH_SIZE = 500;
  let updated = 0;
  let skipped = 0;

  const chunks = [];
  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    chunks.push(snapshot.docs.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    const batch = db.batch();

    for (const doc of chunk) {
      const data = doc.data();
      const current = data.playbackUrl ?? "";

     // if (current.includes(BUNNY_CDN_HOSTNAME) && current.endsWith("/playlist.m3u8")) {
      //  skipped++;
      //  continue;
     // }

      const videoId = data.bunnyVideoId ?? doc.id;
      const newUrl = `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;

      batch.update(doc.ref, { playbackUrl: newUrl });
      updated++;
    }

    await batch.commit();
    console.log(`Batch committed — updated: ${updated}, skipped: ${skipped}`);
  }

  console.log(`\nDone. ${updated} updated, ${skipped} already correct.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

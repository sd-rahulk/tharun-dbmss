const { getFirebaseDb, collections } = require('./firebase-admin');

if (process.env.CONFIRM_FIREBASE_RESET !== 'YES') {
  throw new Error('This deletes the transit collections in Firebase. Set CONFIRM_FIREBASE_RESET=YES to continue.');
}

async function deleteCollection(db, name) {
  const snapshot = await db.collection(name).get();
  let batch = db.batch();
  let count = 0;
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count += 1;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % 400 !== 0) await batch.commit();
  return count;
}

(async () => {
  const db = getFirebaseDb();
  let total = 0;
  for (const name of collections) total += await deleteCollection(db, name);
  console.log(`Deleted ${total} documents from the Firebase transit collections.`);
  console.log('Run npm run db:seed to restore the academic and illustrative demo data.');
})().catch((error) => {
  console.error('Firebase reset failed:', error.message);
  process.exitCode = 1;
});

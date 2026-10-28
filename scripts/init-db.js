const { getFirebaseDb, collections } = require('./firebase-admin');

(async () => {
  const db = getFirebaseDb();
  await Promise.all(collections.map((name) => db.collection(name).limit(1).get()));
  console.log(`Firebase Firestore is ready for project ${process.env.FIREBASE_PROJECT_ID || '(from credentials)'}.`);
  console.log('Firestore is schema-flexible; collection contracts are documented in database/firestore-schema.json.');
})().catch((error) => {
  console.error('Firebase initialization failed:', error.message);
  process.exitCode = 1;
});

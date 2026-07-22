import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspect() {
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  try {
    // Let's find workspaceKeys for carlos@dominus.site
    const keysSnap = await getDocs(query(collection(db, 'workspaceKeys'), where('ownerEmail', '==', 'carlos@dominus.site'), limit(1)));
    let uid = null;
    if (!keysSnap.empty) {
      const data = keysSnap.docs[0].data();
      uid = data.ownerUid;
      console.log("Found carlos workspace uid:", uid);
    } else {
      console.log("Could not find workspace key for carlos@dominus.site, trying to list users in partnerships or general search...");
      // Let's find any collections or workspaceConfig
      const configSnap = await getDocs(collection(db, 'workspaceConfig'));
      configSnap.docs.forEach(doc => {
        console.log("Config uid:", doc.id, doc.data());
      });
      // Try to get docs from sales directly if we can't find carlos
      return;
    }

    if (uid) {
      const salesSnap = await getDocs(collection(db, `users/${uid}/sales`));
      console.log(`\n--- SALES (${salesSnap.size} docs) ---`);
      salesSnap.docs.slice(0, 10).forEach(doc => {
        console.log(doc.id, "=> clientKey:", doc.data().clientKey, "product:", doc.data().productName, "value:", doc.data().value);
      });

      const clientDataSnap = await getDocs(collection(db, `users/${uid}/clientData`));
      console.log(`\n--- CLIENT DATA (${clientDataSnap.size} docs) ---`);
      clientDataSnap.docs.slice(0, 10).forEach(doc => {
        console.log(doc.id, "=> data:", doc.data());
      });
    }
  } catch (err) {
    console.error("Error inspecting:", err);
  }
}
inspect();

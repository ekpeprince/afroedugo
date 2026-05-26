import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOr3R-Subxwq2HjZGB1v7Wz31ttkcJBpQ",
  authDomain: "afroedugo-b0b3f.firebaseapp.com",
  projectId: "afroedugo-b0b3f",
  storageBucket: "afroedugo-b0b3f.firebasestorage.app",
  messagingSenderId: "86185831384",
  appId: "1:86185831384:web:1fffe955dcd6d044a9a0ad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const discussionData = [
  // GENERAL
  {
    text: "Can someone recommend a good public university in Germany for Data Science? I'm looking for zero tuition fees.",
    category: "general",
    user: "Kofi Mensah",
    createdAt: serverTimestamp()
  },
  {
    text: "Is there an Afro student association in Vilnius? Just landed and looking for my community!",
    category: "general",
    user: "Ada Obi",
    createdAt: serverTimestamp()
  },
  // VISA HELP
  {
    text: "What documents do I need for the D-type visa to Poland? Is the insurance from my home country enough?",
    category: "visa",
    user: "Samuel T.",
    createdAt: serverTimestamp()
  },
  {
    text: "Wait times at the Estonian embassy in Lagos are quite long right now. Plan ahead, guys!",
    category: "visa",
    user: "Chioma P.",
    createdAt: serverTimestamp()
  },
  // HOUSING TIPS
  {
    text: "Pro-tip for Kaunas: Look for apartments in Zaliakalnis. It's affordable and very safe for students.",
    category: "housing",
    user: "David Nkosi",
    createdAt: serverTimestamp()
  },
  {
    text: "Always ask for a contract in English AND Lithuanian. Don't sign anything you don't fully understand!",
    category: "housing",
    user: "Agent Sarah",
    createdAt: serverTimestamp()
  }
];

const populateDiscussions = async () => {
  console.log("Community Hub: Seeding live discussions...");
  
  const colRef = collection(db, 'discussions');
  
  // Clear old ones first to ensure clean state for expansion
  const existing = await getDocs(colRef);
  for (const doc of existing.docs) {
    await deleteDoc(doc.ref);
  }
  
  for (const disk of discussionData) {
    await addDoc(colRef, disk);
    console.log(`Added: [${disk.category.toUpperCase()}] ${disk.user}`);
  }
  
  console.log("Community Hub: Seeding complete!");
  process.exit(0);
};

populateDiscussions();

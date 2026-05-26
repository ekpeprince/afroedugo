import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

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

const servicesData = [
  // VISA SUPPORT
  {
    name: "AfroEduGo Elite Visa Support",
    category: "visa",
    description: "Personalized D-Type Visa guidance for Poland, Lithuania, and Germany. 98% Success Rate.",
    price: "From €150",
    duration: "2-4 Weeks",
    whatsapp: "+37060175094",
    isVerified: true
  },
  {
    name: "Express Document Review",
    category: "visa",
    description: "Get your visa documents reviewed by experts before you submit to the embassy.",
    price: "€50",
    duration: "48 Hours",
    whatsapp: "+37060175094",
    isVerified: true
  },
  // INSURANCE
  {
    name: "Schengen Global Health",
    category: "insurance",
    description: "Emassy-approved health insurance with €30,000 minimum coverage for international students.",
    price: "€120 / year",
    duration: "Instant Policy",
    whatsapp: "+37060175094",
    isVerified: true
  },
  // TRANSLATION
  {
    name: "Certified Appostille Services",
    category: "translation",
    description: "Certified translation of birth certificates and academic transcripts into Polish/Lithuanian.",
    price: "From €25 / page",
    duration: "3-5 Days",
    whatsapp: "+37060175094",
    isVerified: true
  }
];

const populateServices = async () => {
  console.log("Services Marketplace: Seeding verified providers...");
  
  const colRef = collection(db, 'services');
  
  const existing = await getDocs(colRef);
  for (const doc of existing.docs) {
    await deleteDoc(doc.ref);
  }
  
  for (const s of servicesData) {
    await addDoc(colRef, s);
    console.log(`Added: [${s.category.toUpperCase()}] ${s.name}`);
  }
  
  console.log("Services Marketplace: Seeding complete!");
  process.exit(0);
};

populateServices();

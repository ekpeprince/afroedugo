import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

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

const schoolsData = [
  {
    name: "Kaunas University of Technology (KTU)",
    location: "Kaunas, Lithuania",
    specialty: "Technology, Engineering, Business",
    tuition: "Min. €3,200 / year",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/KTU_Logo_3A.png",
    whatsapp: "+37037300000"
  },
  {
    name: "Vytautas Magnus University (VMU)",
    location: "Kaunas, Lithuania",
    specialty: "Liberal Arts, Humanities, Science",
    tuition: "Min. €1,700 / year",
    imageUrl: "https://studijos.vdu.lt/wp-content/uploads/2019/04/VDU-logo-hor-grey-eng.png",
    whatsapp: "+37037327200"
  },
  {
    name: "Lithuanian University of Health Sciences (LSMU)",
    location: "Kaunas, Lithuania",
    specialty: "Medicine, Odontology, Pharmacy",
    tuition: "Min. €5,600 / year",
    imageUrl: "https://lsmuni.lt/media/filer_public/40/01/4001b63e-6447-497d-944d-56d787038e23/lsmu_logo_en_col.png",
    whatsapp: "+37037327201"
  },
  {
    name: "Lithuanian Sports University (LSU)",
    location: "Kaunas, Lithuania",
    specialty: "Sports Science, Physical Education",
    tuition: "Min. €1,700 / year",
    imageUrl: "https://www.lsu.lt/wp-content/uploads/2018/01/LSU_logo_EN.png",
    whatsapp: "+37037302621"
  },
  {
    name: "SMK University of Applied Sciences",
    location: "Kaunas, Lithuania",
    specialty: "Marketing, Business, IT",
    tuition: "Min. €3,400 / year",
    imageUrl: "https://www.smk.lt/uploads/media/619f7b0f6e9b8.png",
    whatsapp: "+37060175094"
  }
];

const scout = async () => {
  console.log('AI School Scout: Commencing data population...');
  try {
    const schoolsCol = collection(db, 'schools');
    
    // Clear existing schools (Agent authorized only)
    const snapshot = await getDocs(schoolsCol);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'schools', d.id));
    }
    console.log('Old records cleared.');

    for (const school of schoolsData) {
      await addDoc(schoolsCol, {
        ...school,
        createdAt: serverTimestamp()
      });
      console.log(`Added: ${school.name}`);
    }

    console.log('AI School Scout: Population complete!');
    process.exit(0);
  } catch (error) {
    console.error('Scout failed:', error);
    process.exit(1);
  }
};

scout();

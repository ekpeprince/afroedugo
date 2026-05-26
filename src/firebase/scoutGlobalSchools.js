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

const globalSchools = [
  // LITHUANIA
  {
    name: "SMK University of Applied Sciences",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Marketing, Business, IT",
    tuition: "€3,400 / year",
    tuitionFee: 3400,
    tuitionRange: "Medium",
    courses: ["International Business", "Marketing", "Video Production"],
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37060175094"
  },
  {
    name: "Kaunas University of Technology (KTU)",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Technology & Innovation",
    tuition: "€4,800 / year",
    tuitionFee: 4800,
    tuitionRange: "High",
    courses: ["Artificial Intelligence", "Mechatronics", "Architecture"],
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037300000"
  },
  {
    name: "Vilnius University",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Comprehensive Research",
    tuition: "€2,500 / year",
    tuitionFee: 2500,
    tuitionRange: "Low",
    courses: ["Medicine", "International Relations", "Physics"],
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052687001"
  },
  // POLAND
  {
    name: "University of Warsaw",
    location: "Warsaw, Poland",
    country: "Poland",
    specialty: "Global Studies & Business",
    tuition: "€2,500 / year",
    tuitionFee: 2500,
    tuitionRange: "Low",
    courses: ["International Relations", "Economics", "Finance"],
    imageUrl: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+48225520000"
  },
  {
    name: "Jagiellonian University",
    location: "Krakow, Poland",
    country: "Poland",
    specialty: "Medicine & Humanities",
    tuition: "€2,000 / year",
    tuitionFee: 2000,
    tuitionRange: "Low",
    courses: ["Philosophy", "International Relations", "European Studies"],
    imageUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+48126631111"
  },
  {
    name: "Wroclaw University of Science and Technology",
    location: "Wroclaw, Poland",
    country: "Poland",
    specialty: "Engineering & Tech",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Low",
    courses: ["Information Technology", "Alternative Energy", "Management"],
    imageUrl: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+48713202905"
  },
  // ESTONIA
  {
    name: "University of Tartu",
    location: "Tartu, Estonia",
    country: "Estonia",
    specialty: "Digital Society & IT",
    tuition: "€4,000 / year",
    tuitionFee: 4000,
    tuitionRange: "Medium",
    courses: ["Software Engineering", "Digital Society", "Business"],
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+3727375100"
  },
  {
    name: "TalTech",
    location: "Tallinn, Estonia",
    country: "Estonia",
    specialty: "Engineering & IT",
    tuition: "€3,500 / year",
    tuitionFee: 3500,
    tuitionRange: "Medium",
    courses: ["Cybersecurity", "E-Governance", "Law & Tech"],
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+3726202002"
  },
  {
    name: "Tallinn University",
    location: "Tallinn, Estonia",
    country: "Estonia",
    specialty: "Arts & Humanities",
    tuition: "€3,200 / year",
    tuitionFee: 3200,
    tuitionRange: "Medium",
    courses: ["Crossmedia", "Human-Computer Interaction", "Digital Learning"],
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+3726409101"
  },
  // LATVIA
  {
    name: "University of Latvia",
    location: "Riga, Latvia",
    country: "Latvia",
    specialty: "Sciences & Economics",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Low",
    courses: ["Computer Science", "Business Administration", "Psychology"],
    imageUrl: "https://images.unsplash.com/photo-1527891751199-7225231a68dd?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37167034444"
  },
  {
    name: "Riga Technical University",
    location: "Riga, Latvia",
    country: "Latvia",
    specialty: "Engineering & Business",
    tuition: "€2,800 / year",
    tuitionFee: 2800,
    tuitionRange: "Low",
    courses: ["Aviation Transport", "Civil Engineering", "Management"],
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37167089333"
  },
  // GERMANY
  {
    name: "LMU Munich",
    location: "Munich, Germany",
    country: "Germany",
    specialty: "Public Research",
    tuition: "€0 / year",
    tuitionFee: 0,
    tuitionRange: "Low",
    courses: ["Physics", "Data Science", "Economics"],
    imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+498921800"
  },
  {
    name: "TU Munich (TUM)",
    location: "Munich, Germany",
    country: "Germany",
    specialty: "Technological Excellence",
    tuition: "€0 / year",
    tuitionFee: 0,
    tuitionRange: "Low",
    courses: ["Informatics", "Aerospace Engineering", "Biotechnology"],
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+498928901"
  },
  {
    name: "Humboldt University of Berlin",
    location: "Berlin, Germany",
    country: "Germany",
    specialty: "Public Research",
    tuition: "€0 / year",
    tuitionFee: 0,
    tuitionRange: "Low",
    courses: ["Mind and Brain", "European History", "Data Science"],
    imageUrl: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+493020930"
  }
];

const scoutGlobal = async () => {
  console.log('AI Global Scout: Commencing multi-country migration...');
  try {
    const schoolsCol = collection(db, 'schools');
    
    // Clear existing schools
    const snapshot = await getDocs(schoolsCol);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'schools', d.id));
    }
    console.log('Clearing old records...');

    for (const school of globalSchools) {
      await addDoc(schoolsCol, {
        ...school,
        createdAt: serverTimestamp()
      });
      console.log(`Added: ${school.name} (${school.country})`);
    }

    console.log('AI Global Scout: Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Global Scout failed:', error);
    process.exit(1);
  }
};

scoutGlobal();

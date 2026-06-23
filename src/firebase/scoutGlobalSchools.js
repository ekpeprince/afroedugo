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
    courses: ["Information and Cyber Security", "Computer Games and Animation", "Event Management", "Project management", "Organizational resilience and innovation", "International Business", "Tourism and Recreation", "Marketing and Advertising", "English Foundation", "Finances and Investment Management", "Digital Communication", "Programming and Multimedia", "Video Production and Media", "General Practice Nursing", "Aesthetic Cosmetology", "Business Creation and Management", "International Trade and Customs Logistics", "Future Business and Artificial Intelligence"],
    imageUrl: "/smk_school.jpg",
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
    courses: ["Sustainable Intelligent Habitats", "Applied Mathematics", "Public Policy and Administration", "Architecture", "Robotics", "New Media Language", "Mechatronics", "Mechanical Engineering", "Materials Physics and Nanotechnologies", "Electronics and Electrical Engineering", "Chemical Technology and Engineering", "Aviation Engineering", "Informatics", "Control Technologies", "Electronics Engineering", "Industrial Engineering and Management", "Vehicle Engineering", "Structural and Building Products Engineering", "Translation and Post-editing of Technical Texts", "Artificial Intelligence in Computer Science", "Accounting and Auditing", "International Business", "Aeronautical Engineering", "Biomedical Engineering", "Chemical Engineering", "Electrical Power Engineering", "Environmental Engineering", "Food Science and Nutrition", "Medical Physics", "Public Policy and Security", "Sustainable Management and Production", "Physics", "Chemistry", "Electrical and Electronic Engineering", "Civil Engineering", "Transport Engineering", "Energetics and Power Engineering", "Informatics Engineering", "Materials Engineering", "Measurement Engineering", "History and Theory of Arts", "Political Sciences", "Management", "Economics", "Education", "10th PhD Summer School, 1-5 June, 2026", "Communication Studies and Information Management Technologies", "Public Governance and Civil Society", "Renewable Energy Engineering", "Energy Technologies and Economics", "Sociology", "Artificial Intelligence", "Food Science and Technology", "Business Digitalization Management", "Applied Chemistry", "Industrial Biotechnology", "Materials Physics", "Intensive English language preparatory course (A1 &#8211; B2)", "Sustainable and Energy Efficient Buildings", "Automation and Control", "Electrical Engineering", "Transport Electronics", "Fashion Engineering", "Medicinal Chemistry", "Construction Management", "Fashion Innovation Technologies", "Industrial Engineering", "Biomedical Materials Industries", "Engineering Physics", "Data Science and Artificial Intelligence", "Mathematics", "Innovation Management and Entrepreneurship", "Design for Sustainable Future", "Social Innovations and Research"],
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
    courses: ["Bioinformatics", "Innovation Governance, Law &amp; Communication", "Multilingualism and Digital Technologies", "Sustainable Financial Economics", "Business and Finance", "Business Data Analytics", "Public Management", "Scandinavian Studies (Danish/Norwegian/Swedish/Finnish)", "Career Education", "Chemistry of Nanomaterials", "EuroPhotonics", "European Studies", "Laser Technology", "Laser Physics and Optical Technologies", "Management", "Politics of Global Challenges", "English and Another Foreign Language (German/French/Spanish)", "Business Process Management", "Human Resources Management", "Financial Mathematics", "Sustainable Corporate Finance and Investments", "International Business", "Global Marketing", "Accounting and Audit", "Quantitative Economics", "Light Engineering (Lasers)", "English Philology", "Economics and Investment", "Software Engineering", "Information Systems and Cyber Security", "Dentistry", "Medicine", "Natural Systems Management", "Social Work", "Neurobiology", "Molecular Biology", "Genetics", "Molecular Biotechnology", "Biophysics", "Biochemistry", "Systems Biology", "Pharmaceutical Chemistry", "Nanochemistry and Entrepreneurship", "Geology", "Theoretical Physics and Astrophysics", "Electronics and Telecommunication Technologies", "Chemical Physics", "Computer Modelling", "Mathematics", "Financial and Actuarial Mathematics", "Informatics", "English Studies (Linguistics)", "English Studies (Literature, Linguistics, Culture)", "English Studies (Media Discourse)", "Eastern European and Russian Studies", "International and European Law", "International Communication", "Data Science", "Finance and Banking", "International Business Management", "Marketing and Integrated Communication", "Global Business and Economics", "Digital Marketing", "International Project Management", "DeepTech Entrepreneurship", "Russian Studies Русистика", "Central and East European Languages and Cultures (Polish Studies)", "Photonics and Nanotechnology", "Spanish Philology", "Nursing", "Marketing Technologies", "Art Management", "International Cybersecurity and Cyberintelligence (The Arqus Joint MA Programme)", "Languages and Cultures of the Nordic and Baltic Sea Region", "Lithuanian Studies", "Communication and Information Sciences (PhD)", "Central and East European Languages and Cultures (Russian Studies)", "Italian Philology", "Strategic Economics", "Financial Data Analytics and Sustainable Finance (FINDATA)", "Sustainability and Future Societies", "Strategic Management of Information Systems", "Economics and Finance", "Economics and Management", "Language and AI Management", "Linguistics (Baltic Linguistics)", "Innovative Communication and Entrepreneurship"],
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052687001"
  },
  {
    name: "Vytautas Magnus University (VMU)",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Liberal Arts, Humanities, Science",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Low",
    courses: ["PHD studies at VMU", "Sustainable bio-business management", "Environmental Management", "Sustainable Energy", "Rural Development Administration", "Accounting and Finance", "Sports Business MBA", "Biotechnology and Pharmaceutical Analysis", "Business Administration", "English Philology", "Informatics Systems", "Biology and Genetics", "Biotechnology", "Environmental Science and Protection", "Political studies: International Politics and Development Studies", "Political Studies: World Politics and Economy", "Sociology and Anthropology: specialization Society, Culture and Communication", "Diplomacy and International Relations", "Molecular Biology and Biotechnology", "Applied Informatics", "Social Anthropology", "Marketing and International Commerce", "Sociolinguistics and Multilingualism", "Future Media and Journalism", "Performing Arts", "Sustainable Engineering", "Economics and Finance", "Applied English Linguistics", "Languages and Cultures: Francophone Studies, Italian Studies and Romance Languages, German Language and Communication", "Multimedia and Internet Technologies", "Business Logistics", "Logistics and Commerce", "Accounting and Finance / Учет и Финансы (in Russian/English)", "Music Production", "Educational Management", "Social Work: specialisation Social Work in the Context of Global Crises", "Agronomy", "Ecology and Climate Change", "Sport Studies (in Kaunas)", "Customs Process Management (Online)"],
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037327200"
  },
  {
    name: "Lithuanian University of Health Sciences (LSMU)",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Medicine, Odontology, Pharmacy",
    tuition: "€6,000 / year",
    tuitionFee: 6000,
    tuitionRange: "High",
    courses: ["Medicine", "Odontology (Dentistry)", "Pharmacy", "Veterinary Medicine", "Applied Public Health", "Nursing", "Occupational Therapy", "Food Science", "Animal Science", "Health Psychology", "Physiotherapy", "Clinical Health Psychology", "Animal and Human Interaction", "Medicinal Chemistry", "ONLINE Pre-Medical Course", "Medical and Veterinary Genetics", "Laboratory Medicine Biology", "Dental Hygiene"],
    imageUrl: "https://images.unsplash.com/photo-1580281658626-ee379f3cce93?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037327201"
  },
  {
    name: "Vilnius Gediminas Technical University (VILNIUS TECH)",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Engineering & Architecture",
    tuition: "€3,500 / year",
    tuitionFee: 3500,
    tuitionRange: "Medium",
    courses: ["Digital Twin Technology", "Artificial Intelligence Systems", "Sustainability Management", "Communication of Creative Society", "Data Science and Statistics", "Engineering of Artificial Intelligence", "Management of Artificial Intelligence Solutions", "Information Systems Software Engineering", "Entertainment Producing", "Bioengineering", "Aviation Mechanics Engineering", "Logistics and Transport Management", "Construction and Real Estate Management", "Electrical Power Renewable Energy Engineering", "Automotive Engineering", "Biomedical Engineering", "Architecture", "Business Management", "Civil Engineering", "Information Systems Engineering", "Computer Engineering", "Information Technologies", "Mechanical Engineering", "Mechatronics and Robotics", "Financial Engineering", "Creative Industries", "Applied Artificial Intelligence", "Environmental Engineering and Management", "International Business", "Industrial Engineering and Innovation Management", "Mechatronics Systems", "Structural Engineering", "Financial Engineering (FinTech)", "Information and Information Technologies Security", "Global Economics", "Aerospace Engineering", "Automotive Engineering and Management", "Environmental Technology", "Cybersecurity and Communication Technologies", "Medical Engineering", "Multimedia Design", "Transport Logistics", "Nanobiotechnology", "Business Leadership", "Mathematics of Modern Technologies", "PhD in Civil Engineering", "PhD in Mechanical Engineering", "PhD in Communication and Information", "PhD in History and Theory of Arts", "PhD in Environmental Engineering", "PhD in Management", "PhD in Economics"],
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052745000"
  },
  {
    name: "Mykolas Romeris University (MRU)",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Social Sciences & Law",
    tuition: "€2,800 / year",
    tuitionFee: 2800,
    tuitionRange: "Low",
    courses: ["Business Economics and Sustainable Development", "Game Development and Digital Animation", "English for Specific Purposes and the Second Foreign Language", "Psychology", "Communication and Digital Marketing", "Business Administration, MBA", "Financial Management", "European and International Business Law (Joint study programme)", "European Union Law and Governance (Double diploma programme)", "International Law", "Logistics Management", "Law, Technology and Business", "Mediation (LL.M.)", "LegalTech (LL.M.)", "English for Specific Purposes and Korean studies", "Global Business and Modern Marketing", "Preparatory English Language Courses B1", "Cybersecurity Management", "Public Relations Management", "Business Management and Startup Building", "Law and Global Security", "Digital Media Design", "Project Management", "GOvernance and Administration of Leisure and sports", "PhD in Education Science", "PhD in Economics", "PhD in Management", "PhD in Law", "PhD in Psychology", "Preparatory English Language Course B2", "English for Specific Purposes and Interculturality"],
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052714625"
  },
  {
    name: "Klaipėda University (KU)",
    location: "Klaipėda, Lithuania",
    country: "Lithuania",
    specialty: "Marine Research & Social Sciences",
    tuition: "€2,500 / year",
    tuitionFee: 2500,
    tuitionRange: "Low",
    courses: ["LEISURE SPORTS", "PHYSIOTHERAPY", "ENGLISH PHILOLOGY", "RECREATION AND TOURISM", "MANAGEMENT", "ECONOMICS", "Social Work and Crisis Intervention", "PHYSICAL GEOGRAPHY AND OCEANOGRAPHY", "INFORMATICS", "MECHANICAL ENGINEERING", "ELECTRICAL ENGINEERING", "SHIPPING AND PORT ENGINEERING", "INNOVATIVE PROCESSES ENGINEERING", "HEALTH CARE MANAGEMENT", "BUSINESS MANAGEMENT", "REGIONAL GOVERNANCE", "ENGLISH AND ANOTHER FOREIGN LANGUAGE (German/French) AND BUSINESS COMMUNICATION", "HISTORY OF EUROPE", "CHEMICAL ENGINEERING (Environment and Energy)", "PRODUCTION ENGINEERING", "Joint Master: MARINE BIOTECHNOLOGY", "PHYSICAL ACTIVITY AND SPORT PEDAGOGY", "MARINE TRANSPORT ENGINEERING", "INNOVATIVE ELECTRICAL AND AUTOMATION SYSTEMS", "Public Health", "Public Health Education"],
    imageUrl: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37046398900"
  },
  {
    name: "Lithuanian Sports University (LSU)",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Sports Science, Physical Education",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Low",
    courses: ["MSc Tourism and Sports Management", "MSc Public Health and Physical Activity", "MSc Advanced Practice Physiotherapy", "MSc Sports Physiology", "International MSc Basketball Coaching and Management", "International Master in Performance Analysis of Sport", "PhD Social Sciences: Education", "BSc Physiotherapy", "BSc Sports Coaching", "PhD Biology", "BSc Sports and Tourism Management", "Exercise, Nutrition and Stress Management", "MSc Adapted Physical Activity"],
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037302621"
  },
  {
    name: "Lithuanian Academy of Music and Theatre (LMTA)",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Music, Theatre, Film",
    tuition: "€4,500 / year",
    tuitionFee: 4500,
    tuitionRange: "Medium",
    courses: ["Music Performance (in Vilnius and Klaipėda)", "Dance and Education (in Klaipėda)", "Composition (in Vilnius)", "Music Studies (in Vilnius)", "Dance (in Vilnius)"],
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052612691"
  },
  {
    name: "ISM University of Management and Economics",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Business & Economics",
    tuition: "€5,000 / year",
    tuitionFee: 5000,
    tuitionRange: "High",
    courses: ["Economics and Politics", "International Business and Communication", "Finance", "International Marketing and Management", "Financial Economics", "Entrepreneurship and Innovation", "Global Leadership and Strategy", "Business Management and Marketing", "Economics and Data Analytics", "Innovation and Technology Management"],
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052123960"
  },
  {
    name: "LCC International University",
    location: "Klaipėda, Lithuania",
    country: "Lithuania",
    specialty: "Liberal Arts, Business, Theology",
    tuition: "€3,500 / year",
    tuitionFee: 3500,
    tuitionRange: "Medium",
    courses: ["International Business Administration", "Global Business and Public Engagement", "International Relations and Development", "Theology", "Psychology", "English Language and Literature", "MA &#8211; IINGOL (international institutions, NGOs, civil society, government, and related sectors)", "MA &#8211; TESOL (Teaching English to Speakers of Other Languages)"],
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37046310460"
  },
  {
    name: "Center for Physical Sciences and Technology (FTMC)",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Physical Sciences & Technology",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Medium",
    courses: ["Chemistry (PhD)", "Materials Engineering (PhD)", "Physics (PhD)"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052649211"
  },
  {
    name: "European Humanities University",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Humanities & Liberal Arts",
    tuition: "€2,500 / year",
    tuitionFee: 2500,
    tuitionRange: "Low",
    courses: ["Media and Communication", "European Heritage", "Visual Design", "International Law and Law of the European Union", "World Politics and Economics", "Visual Plastic Art", "Cultural Heritage Development", "Public Policy", "Philosophy", "Theatre Art and Acting", "Театральное искусство и актёрская игра", "Философия", "Публичная политика", "Развитие культурного наследия", "Визуальная пластика", "Мировая политика и экономика", "Международное право и право Европейского союза", "Визуальный дизайн", "Европейское наследие", "Медиа и коммуникация", "Gender Studies", "Computer Science"],
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052740622"
  },
  {
    name: "Kauno kolegija Higher Education Institution",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences & Arts",
    tuition: "€2,800 / year",
    tuitionFee: 2800,
    tuitionRange: "Low",
    courses: ["Sales and Marketing", "Organizational Management", "Multimedia Technology", "Tourism and Hotel Management", "International Business", "English for Public Relations", "Photography", "General Practice Nursing", "Software systems", "Oral Hygiene", "Fashion Design"],
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037321111"
  },
  {
    name: "Kazimieras Simonavicius University (KSU)",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Aviation & Business",
    tuition: "€3,200 / year",
    tuitionFee: 3200,
    tuitionRange: "Medium",
    courses: ["Aviation Management", "Organizational Innovation and Management", "Aviation Management Online", "Business Management", "Fashion Industry", "Integrated Communication", "Cinema Industry Management", "Contemporary Communication and Media", "Fashion Management"],
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052135172"
  },
  {
    name: "Klaipėdos valstybinė kolegija / Higher Education Institution",
    location: "Klaipėda, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences & Health",
    tuition: "€2,600 / year",
    tuitionFee: 2600,
    tuitionRange: "Low",
    courses: ["Physiotherapy", "General Practice Nursing", "Dental Hygiene", "Finance", "Tourism Business", "Informatics", "Management of Organizations"],
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37046313111"
  },
  {
    name: "Kolpingo kolegija / Kolping Higher Education Institution",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Social Sciences",
    tuition: "€2,200 / year",
    tuitionFee: 2200,
    tuitionRange: "Low",
    courses: ["Transport Logistics (Only in the Lithuanian language)", "Social Work Management", "Child Welfare and Social Security (Only in the Lithuanian language)"],
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037202312"
  },
  {
    name: "Lietuvos inžinerijos kolegija / Higher Education Institution",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Engineering",
    tuition: "€2,900 / year",
    tuitionFee: 2900,
    tuitionRange: "Low",
    courses: ["AUTOMOTIVE ENGINEERING", "MOTOR TRANSPORT ELECTRONICS", "ELECTRONICS ENGINEERING", "ELECTRICAL ENERGY", "HYDROTECHNICAL ENGINEERING", "ROAD ENGINEERING", "LAND USE PLANNING AND MANAGEMENT", "MECHANICAL ENGINEERING", "REAL ESTATE MEASUREMENT AND VALUATION TECHNOLOGIES", "AIRCRAFT SYSTEMS ENGINEERING", "SUSTAINABLE CONSTRUCTION", "FORESTRY", "LANDSCAPE DESIGN"],
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037308611"
  },
  {
    name: "Lithuania Business College",
    location: "Klaipėda, Lithuania",
    country: "Lithuania",
    specialty: "Business & Management",
    tuition: "€2,700 / year",
    tuitionFee: 2700,
    tuitionRange: "Low",
    courses: ["Smart Management", "Sales and Logistics Management", "Tourism and Entertainment Business Industry", "Applied Informatics and Programming", "Online Courses: Modern Economic Theories (part I)", "Online Courses: Course of Information Technologies", "Online Courses: Communication Psychology", "Online Courses: Research Methodology"],
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37046311099"
  },
  {
    name: "Lithuanian Centre For Social Sciences",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Social Sciences Research",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Medium",
    courses: ["Economics", "Sociology"],
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052123333"
  },
  {
    name: "Lithuanian Energy Institute",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Energy Research",
    tuition: "€3,200 / year",
    tuitionFee: 3200,
    tuitionRange: "Medium",
    courses: [],
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037401801"
  },
  {
    name: "Lithuanian Maritime Academy",
    location: "Klaipėda, Lithuania",
    country: "Lithuania",
    specialty: "Maritime & Shipping",
    tuition: "€3,100 / year",
    tuitionFee: 3100,
    tuitionRange: "Medium",
    courses: ["Marine Navigation", "Marine Electrical and Electronic Engineering", "Maritime Transport Logistics Technologies", "Marine Engineering"],
    imageUrl: "https://images.unsplash.com/photo-1517414764835-132d7877c8e9?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37046397240"
  },
  {
    name: "Panevėžio kolegija / State Higher Education Institution",
    location: "Panevėžys, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences",
    tuition: "€2,500 / year",
    tuitionFee: 2500,
    tuitionRange: "Low",
    courses: ["General Practice Nursing", "Physiotherapy", "Beauty Therapy", "Logistics", "International Business", "Construction", "Development and Maintenance of Information Systems"],
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37045468600"
  },
  {
    name: "Šiaulių valstybinė kolegija / Higher Education Institution",
    location: "Šiauliai, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences & Health",
    tuition: "€2,400 / year",
    tuitionFee: 2400,
    tuitionRange: "Low",
    courses: ["Automotive Electronics", "Business Analytics", "International Business", "Information Management", "Automatics and Electrical Engineering", "Information Systems Technology", "General Practice Nursing"],
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37041525051"
  },
  {
    name: "St. Ignatius of Loyola College",
    location: "Kaunas, Lithuania",
    country: "Lithuania",
    specialty: "Health & Arts",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Medium",
    courses: ["Hospitality Management", "Image Design", "Orthopedic Technology", "Emergency Medical Aid", "Culinary Arts", "Pastoral Care", "Social Work"],
    imageUrl: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37037202020"
  },
  {
    name: "Utenos kolegija / Higher Education Institution",
    location: "Utena, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences",
    tuition: "€2,300 / year",
    tuitionFee: 2300,
    tuitionRange: "Low",
    courses: ["Environment Protection Engineering", "Automatic Control Systems", "Information Systems Engineering", "Foodstuff Technology", "Odontological Care", "Physiotherapy", "General Practice Nursing", "Cosmetology", "Law", "Accounting", "Business Management and Innovations", "Social Work", "Management of Tourism Services"],
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37038951615"
  },
  {
    name: "Vilniaus kolegija / Higher Education Institution",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Applied Sciences & Business",
    tuition: "€3,000 / year",
    tuitionFee: 3000,
    tuitionRange: "Medium",
    courses: ["Civil Engineering", "Information Systems and Cyber Security", "Transport Logistics", "International Business", "Creativity and Business Innovations", "Hotel and Restaurant Business", "Tourism Management", "Banking", "Business Economics", "Software Engineering", "Popular Music"],
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052191600"
  },
  {
    name: "Vilnius Academy of Arts",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Fine Arts & Design",
    tuition: "€4,500 / year",
    tuitionFee: 4500,
    tuitionRange: "Medium",
    courses: ["Architecture (Kaunas)", "Interior Design (Kaunas)", "Applied Arts (Telšiai)", "Textile Art Media (Kaunas)", "Sculpture (Kaunas)", "Glass and Art Design (Kaunas)", "Site-specific Art/Fresco-mosaic (Vilnius)", "Visual Communication Design (Vilnius)", "Ceramics (Kaunas)", "Textile and Art Design (Vilnius)", "Sculpture (Vilnius)", "Scenography (Vilnius)", "Photography and Media Arts (Vilnius)", "Painting (Vilnius)", "Graphic Art (Vilnius)", "Ceramics (Vilnius)", "Design (Vilnius)", "Metal Art and Jewelry (Telšiai)", "Design/Product Design (Telšiai)", "Illustration and Contexts (Kaunas)", "Animation (Vilnius)", "Restoration of Art and Interior Heritage (Vilnius)", "Interior Design (Klaipėda)", "Graphic Design (Klaipėda)", "Artworks Restoration and Conservation (Telšiai)", "Sculpture (Telšiai)", "Photography (Kaunas)"],
    imageUrl: "https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052105430"
  },
  {
    name: "Vilnius Business College / Higher Education Institution",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Business & IT",
    tuition: "€3,200 / year",
    tuitionFee: 3200,
    tuitionRange: "Medium",
    courses: ["Media Technologies", "International Hospitality Management", "Health Technology and Innovation Business", "Business Development and Entrepreneurship", "Cybersecurity Technologies", "Business Management and Marketing", "Programming and Internet Technologies", "Game Development", "Academic English Preparatory Programme", "International E-Business and Commerce"],
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052136000"
  },
  {
    name: "Vilnius College of Design",
    location: "Vilnius, Lithuania",
    country: "Lithuania",
    specialty: "Design & Arts",
    tuition: "€4,000 / year",
    tuitionFee: 4000,
    tuitionRange: "Medium",
    courses: ["Artificial Intelligence", "Robotic Systems Programming", "User Interface Development", "Business Process Automatisation", "Software Systems Development", "Software Testing", "Data Analytics", "Cybersecurity", "Programming", "Digital Design", "Photography", "Fashion and Accessories Design", "Interior Design", "Graphic Design"],
    imageUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
    whatsapp: "+37052611111"
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

import React, { useState, useMemo, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { getWhatsAppLink } from '../utils/whatsapp'
import SmartImage from '../components/SmartImage'
import InquiryModal from '../components/InquiryModal'
import ComparisonModal from '../components/ComparisonModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY, db } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import { collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import MapContainer from '../components/MapContainer'

const locationCoords = {
  "vilnius, lithuania": { lat: 54.6872, lng: 25.2797 },
  "kaunas, lithuania": { lat: 54.8985, lng: 23.9036 },
  "warsaw, poland": { lat: 52.2297, lng: 21.0122 },
  "krakow, poland": { lat: 50.0647, lng: 19.9450 },
  "aachen, germany": { lat: 50.7753, lng: 6.0839 },
  "munich, germany": { lat: 48.1351, lng: 11.5820 },
  "tartu, estonia": { lat: 58.3780, lng: 26.7289 },
  "tallinn, estonia": { lat: 59.4370, lng: 24.7536 },
  "riga, latvia": { lat: 56.9496, lng: 24.1052 },
  "berlin, germany": { lat: 52.5200, lng: 13.4050 }
};

const getCoordsForLocation = (location) => {
  if (!location) return { lat: 54.6872, lng: 25.2797 };
  const normalized = location.toLowerCase().trim();
  for (const [key, coords] of Object.entries(locationCoords)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return { lat: 54.6872, lng: 25.2797 }; // Fallback
};

const courseMatchesCategory = (courses, category) => {
  if (category === 'All') return true;
  if (!courses || courses.length === 0) return false;
  
  const cLower = courses.map(c => c.toLowerCase());
  
  if (category === 'Bachelor') {
    return cLower.some(c => !c.includes('master') && !c.includes('msc') && !c.includes('phd') && !c.includes('doctor') && !c.includes('society'));
  }
  if (category === 'Masters') {
    const keywords = ['master', 'msc', 'software', 'cyber', 'data', 'learning', 'e-governance', 'alternative energy', 'aerospace', 'hci', 'interaction'];
    return cLower.some(c => keywords.some(k => c.includes(k)));
  }
  if (category === 'PhD') {
    const keywords = ['phd', 'doctor', 'philosophy', 'semiotics', 'bioengineering', 'physics', 'mind', 'brain'];
    return cLower.some(c => keywords.some(k => c.includes(k)));
  }
  if (category === 'IT') {
    const keywords = ['it', 'computer', 'software', 'artificial', 'mechatronics', 'aviation', 'telecommunication', 'cyber', 'data', 'automotive', 'engineering', 'informatics', 'interaction', 'design', 'learning'];
    return cLower.some(c => keywords.some(k => c.includes(k)));
  }
  if (category === 'Business') {
    const keywords = ['business', 'marketing', 'management', 'tourism', 'hotel', 'economics', 'finance', 'relation', 'european', 'law', 'e-governance', 'administration'];
    return cLower.some(c => keywords.some(k => c.includes(k)));
  }
  if (category === 'Science') {
    const keywords = ['medicine', 'physics', 'architecture', 'philosophy', 'aerospace', 'bioengineering', 'semiotics', 'cyber', 'data', 'biotechnology', 'history', 'mind', 'brain', 'psychology'];
    return cLower.some(c => keywords.some(k => c.includes(k)));
  }
  return true;
};

const SchoolFinder = ({ onBack, initialSchools }) => {
  const router = useRouter();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryItem, setInquiryItem] = useState(null);

  const openInquiry = (item) => {
    setInquiryItem(item);
    setIsInquiryOpen(true);
  };
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const { user } = useAuth();
  const { data: liveSchools, loading: dbLoading, error: dbError } = useFirestore('schools');
  const verifiedSchools = useMemo(() => {
    const raw = (liveSchools && liveSchools.length > 0) ? liveSchools : (initialSchools || []);
    return raw.map(school => {
      if (school.name && school.name.trim() === "Smk Collage Of Applied Science") {
        return { ...school, name: "SMK University of Applied Sciences" };
      }
      return school;
    });
  }, [liveSchools, initialSchools]);
  const [favorites, setFavorites] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [viewMode, setViewMode] = useState('list');
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const schoolsWithCoords = useMemo(() => {
    return verifiedSchools.map(school => {
      if (school.lat && school.lng) {
        return school;
      }
      const coords = getCoordsForLocation(school.location);
      return { ...school, ...coords };
    });
  }, [verifiedSchools]);

  // Fetch local favorites
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const fetchFavorites = async () => {
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setFavorites(querySnapshot.docs.map(doc => doc.data().itemId));
    };
    fetchFavorites();
  }, [user]);

  const handleToggleFavorite = async (school) => {
    if (!user) {
      alert("Please login to save schools!");
      return;
    }

    const isFav = favorites.includes(school.id);
    if (isFav) {
      // Remove
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', school.id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      setFavorites(prev => prev.filter(id => id !== school.id));
    } else {
      // Add
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        itemId: school.id,
        itemTitle: school.name,
        itemType: 'school',
        createdAt: new Date()
      });
      setFavorites(prev => [...prev, school.id]);
    }
  };

  const handleToggleCompare = (school) => {
    if (compareList.find(s => s.id === school.id)) {
      setCompareList(prev => prev.filter(s => s.id !== school.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 schools at a time.");
        return;
      }
      setCompareList(prev => [...prev, school]);
    }
  };

  const countries = ['All', 'Lithuania', 'Poland', 'Estonia', 'Latvia', 'Germany'];
  const budgetOptions = [
    { label: 'Any Budget', value: 'All' },
    { label: 'Under €2,000', value: 2000 },
    { label: 'Under €4,000', value: 4000 },
  ];

  const {
    ready,
    value: googleValue,
    suggestions: { status: googleStatus, data: googleData },
    setValue: setGoogleValue,
    clearSuggestions: clearGoogleSuggestions,
    init,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ["university", "school"],
      componentRestrictions: { country: ["lt"] },
    },
    debounce: 300,
    initOnMount: false,
  });

  useEffect(() => {
    if (isLoaded) {
      init();
    }
  }, [isLoaded, init]);

  const handleInput = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    setGoogleValue(val);
  };

  const handleSelect = async (suggestion) => {
    if (!isLoaded) return;
    setLocalSearch(suggestion.description);
    setGoogleValue(suggestion.description, false);
    clearGoogleSuggestions();
    setIsSearching(true);

    try {
      // Fetch core coordinates
      const results = await getGeocode({ address: suggestion.description });
      const { lat, lng } = await getLatLng(results[0]);
      
      // Fetch additional details (Rating, Website)
      const details = await new Promise((resolve) => {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({ 
          placeId: suggestion.place_id,
          fields: ['rating', 'website', 'user_ratings_total']
        }, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(place);
          } else {
            resolve({});
          }
        });
      });
      
      const googleResult = {
        id: suggestion.place_id,
        name: suggestion.structured_formatting.main_text,
        location: suggestion.structured_formatting.secondary_text,
        isGoogleResult: true,
        lat,
        lng,
        rating: details?.rating,
        userRatingsTotal: details?.user_ratings_total,
        website: details?.website
      };

      setSearchResults([googleResult]);
    } catch (error) {
      console.error("Error fetching geocode/details:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setLocalSearch("");
    setGoogleValue("");
    setSearchResults([]);
    clearGoogleSuggestions();
  };

  // Natural Language Parsing Logic
  useEffect(() => {
    const query = localSearch.toLowerCase();
    
    // Auto-detect Country
    const foundCountry = countries.find(c => c !== 'All' && query.includes(c.toLowerCase()));
    if (foundCountry && selectedCountry !== foundCountry) {
      setSelectedCountry(foundCountry);
    }

    // Auto-detect Budget
    if (query.includes('cheap') || query.includes('low') || query.includes('under 2000')) {
      setSelectedBudget(2000);
    } else if (query.includes('medium') || query.includes('under 4000')) {
      setSelectedBudget(4000);
    }
  }, [localSearch]);

  // Fuzzy match helper for Hybrid Search
  const isFuzzyMatch = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    return s1.includes(s2) || s2.includes(s1);
  };

  // Hybrid logic: Identify if a Google result matches a verified school
  const combinedResults = useMemo(() => {
    const searchTerm = localSearch.toLowerCase();
    
    let list = [];
    if (searchResults.length > 0) {
      list = searchResults.map(result => {
        const verified = schoolsWithCoords.find(s => isFuzzyMatch(s.name, result.name));
        return verified ? { ...verified, isVerified: true } : { ...result, isGlobal: true };
      });
    } else {
      list = schoolsWithCoords.filter(school => {
        // Country Filter
        const countryMatch = selectedCountry === 'All' || school.country === selectedCountry;
        
        // Budget Filter (Numeric)
        const budgetMatch = selectedBudget === 'All' || school.tuitionFee <= selectedBudget;
        
        // Multi-field Search (Name, City, Courses)
        const searchMatch = !searchTerm || 
          school.name.toLowerCase().includes(searchTerm) ||
          school.location.toLowerCase().includes(searchTerm) ||
          (school.courses && school.courses.some(c => c.toLowerCase().includes(searchTerm)));

        return countryMatch && budgetMatch && searchMatch;
      });
    }

    return list.filter(school => courseMatchesCategory(school.courses, selectedCategory));
  }, [schoolsWithCoords, selectedCountry, selectedBudget, localSearch, searchResults, selectedCategory]);

  if (dbLoading && verifiedSchools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* studyin.lt Inspired Sticky Header */}
      <header className="relative bg-white border-b border-gray-100 flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-xl font-bold transition-colors">
                ←
            </button>
            <h1 className="text-sm font-bold uppercase tracking-wider text-gray-700">Accredited Programmes</h1>
        </div>

        <button 
            onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 border rounded-full px-4 py-2 hover:bg-gray-50 transition-all"
        >
            <span>{viewMode === 'list' ? '🗺️ Map View' : '📋 List View'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="p-4 md:p-6 space-y-6 pt-4 md:pt-6 max-w-7xl mx-auto w-full">
        {/* studyin.lt Style Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-[2rem] p-6 md:p-10 text-center text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="bg-primary/20 text-primary-300 border border-primary/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
              Study in Europe
            </span>
            <h1 className="text-2xl md:text-5xl font-black tracking-tight leading-tight mb-3">
              Co-create your future in Europe
            </h1>
            <p className="text-gray-300 font-bold text-xs md:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
              Find English-taught Bachelor's, Master's, and PhD degree programs.
            </p>

            {/* Centered Global Search Bar */}
            <div className="relative max-w-xl mx-auto z-20">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-1.5 shadow-xl focus-within:ring-2 ring-primary/20 focus-within:bg-white/15 transition-all">
                <div className="p-2 text-white/50">
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                  )}
                </div>
                <input
                  value={localSearch}
                  onChange={handleInput}
                  placeholder="Search programmes, courses, or universities..."
                  className="flex-1 bg-transparent p-2 outline-none font-bold text-white placeholder:text-white/40 text-xs"
                />
                {localSearch && (
                  <button 
                    onClick={handleClear}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Autocomplete Search Suggestions */}
              {GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY" && googleStatus === "OK" && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30 text-left">
                  {googleData.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => handleSelect(suggestion)}
                      className="w-full text-left p-3 hover:bg-primary/5 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-2.5 text-xs"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-lg text-gray-400 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{suggestion.structured_formatting.main_text}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{suggestion.structured_formatting.secondary_text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 text-[200px] opacity-5 select-none pointer-events-none">🌍</div>
        </div>

        {/* Sticky Filters Wrapper */}
        <div className="sticky top-0 z-40 space-y-4 bg-gray-50/95 backdrop-blur-md py-3 -mx-2 px-2">
          {/* Explore Opportunities (Pill Filters) */}
          <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Let's explore the opportunities</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: 'All', label: 'All Degrees', icon: '🌟' },
                { id: 'Bachelor', label: 'Bachelor Programs', icon: '🎓' },
                { id: 'Masters', label: 'Master Degrees', icon: '🚀' },
                { id: 'PhD', label: 'PhD / Doctorates', icon: '🔬' },
                { id: 'IT', label: 'IT & Tech', icon: '💻' },
                { id: 'Business', label: 'Business & Management', icon: '📊' },
                { id: 'Science', label: 'Science & Health', icon: '🩺' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wider transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country & Budget Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
            {/* Country Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 no-scrollbar">
              {countries.map(country => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCountry === country 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {country === 'All' ? '🌐 All Countries' : country}
                </button>
              ))}
            </div>

            {/* Budget Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Budget:</span>
              <select 
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="bg-gray-50 border-none outline-none text-[10px] font-black px-3 py-2 rounded-xl text-gray-500 hover:text-primary cursor-pointer transition-colors border border-gray-100"
              >
                {budgetOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Smart Recommendations Section */}
        {user && favorites.length > 0 && selectedCountry === 'Lithuania' && combinedResults.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-base">✨</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recommended for You</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
              {verifiedSchools
                .filter(s => !favorites.includes(s.id) && s.country === verifiedSchools.find(fs => fs.id === favorites[0])?.country)
                .slice(0, 5)
                .map(school => (
                  <button 
                    key={school.id}
                    onClick={() => setLocalSearch(school.name)}
                    className="flex-shrink-0 w-56 bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 hover:shadow-md transition-all text-left animate-in fade-in"
                  >
                    <SmartImage src={school.imageUrl} className="w-10 h-10 rounded-lg object-cover" type="school" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs truncate">{school.name}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{school.country}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Listings / Map Render */}
        {selectedCountry === 'All' && selectedCategory === 'All' && !localSearch.trim() && searchResults.length === 0 ? null : viewMode === 'map' ? (
          <div className="h-[60vh] w-full rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <MapContainer items={combinedResults} type="school" />
          </div>
        ) : combinedResults.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M12 12l0 0"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No schools found</h3>
            <p className="text-gray-400 font-medium text-xs max-w-xs mx-auto">Try adjusting your filters or search terms to find more options.</p>
            <button 
              onClick={() => {setSelectedCountry('All'); setSelectedBudget('All'); setSelectedCategory('All'); setLocalSearch("");}}
              className="mt-4 text-primary font-bold text-xs hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {combinedResults.map((school) => (
              school.isVerified || !school.isGlobal ? (
                <div 
                  key={school.id} 
                  onClick={() => router.push(`/schools/${school.id}`)}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-gray-200/40 border border-gray-100 group cursor-pointer hover:shadow-xl hover:scale-[1.005] transition-all flex flex-col h-full justify-between"
                >
                  <div className="relative overflow-hidden">
                    <SmartImage 
                      src={school.imageUrl} 
                      alt={school.name} 
                      className="h-44 w-full group-hover:scale-103 transition-transform duration-500 object-cover"
                      type="school"
                    />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(school);
                        }}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
                          favorites.includes(school.id) 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.includes(school.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      
                      {/* Compare Checkbox */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCompare(school);
                        }}
                        className={`absolute top-3 right-14 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
                          compareList.find(s => s.id === school.id) 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-primary'
                        }`}
                        title="Compare School"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="9" y1="3" x2="9" y2="21"/>
                        </svg>
                      </button>
                    </div>
                  
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1 9 7 2 8l5 5-2 7 7-3 7 3-2-7 5-5-7-1-3-6z"/>
                          </svg>
                          Verified Partner
                        </span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {school.country}
                        </span>
                      </div>
                      
                      <Link href={`/schools/${school.id}`} className="hover:text-primary transition-all" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-1 text-gray-900 leading-tight">{school.name}</h3>
                      </Link>
                      <p className="text-gray-500 text-xs mb-3 font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {school.location}
                      </p>

                      {school.courses && school.courses.length > 0 && (
                        <div className="mb-4">
                          <select 
                            className="w-full bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">View {school.courses.length} Available Programs</option>
                            {school.courses.map(course => (
                              <option key={course} value={course}>
                                {course}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Estimated Fee</span>
                        <span className="text-lg font-black text-gray-900">{school.tuition}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInquiry(school);
                        }}
                        className="bg-primary text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md shadow-primary/10 hover:scale-103 transition-all active:scale-97"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={school.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col justify-between h-full gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                        Global Discovery
                      </span>
                      {school.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1 9 7 2 8l5 5-2 7 7-3 7 3-2-7 5-5-7-1-3-6z"/>
                          </svg>
                          <span className="text-xs font-black">{school.rating}</span>
                          <span className="text-[9px] opacity-60 font-bold">({school.userRatingsTotal})</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{school.name}</h3>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {school.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openInquiry(school); }}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                    >
                      Request Info
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14m-7-7 7 7-7 7"/>
                      </svg>
                    </button>
                    {school.website && (
                      <a 
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Newsletter section */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-primary to-indigo-900 rounded-[2rem] p-6 md:p-10 text-center text-white relative overflow-hidden group shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mb-2 inline-block">STAY CONNECTED</span>
              <h3 className="text-xl md:text-3xl font-black mb-3 leading-tight">Dreaming of studying in Europe?</h3>
              <p className="text-white/70 text-xs font-medium max-w-md mx-auto mb-6 leading-relaxed">
                Sign up for the AfroEduGo newsletter to receive visa tips, tuition alerts, and verified housing offers directly in your inbox.
              </p>
              
              <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing! Check your email for updates."); }} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto bg-white/10 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email address" 
                  className="flex-1 bg-transparent px-3 py-2 outline-none text-white font-bold placeholder:text-white/40 text-xs"
                />
                <button 
                  type="submit" 
                  className="bg-white text-primary px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Subscribe
                </button>
              </form>
            </div>
            <div className="absolute -right-10 -bottom-10 text-[150px] opacity-5 select-none pointer-events-none">📬</div>
          </div>
        </section>
      </div>

      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        item={inquiryItem} 
        type="school" 
      />

      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-300">Comparing</span>
            <span className="font-bold text-sm">{compareList.length} {compareList.length === 1 ? 'School' : 'Schools'}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              disabled={compareList.length < 2}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                compareList.length >= 2 
                  ? 'bg-primary hover:bg-primary-600 text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95' 
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              Compare Now
            </button>
            <button 
              onClick={() => setCompareList([])}
              className="px-4 py-2 rounded-xl bg-white/10 text-white/70 font-bold text-xs hover:bg-white/20 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <ComparisonModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        schools={compareList}
      />
    </div>
  )
}

export default SchoolFinder

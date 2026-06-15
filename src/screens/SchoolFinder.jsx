import React, { useState, useMemo, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { getWhatsAppLink } from '../utils/whatsapp'
import SmartImage from '../components/SmartImage'
import InquiryModal from '../components/InquiryModal'
import Link from 'next/link'
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

const SchoolFinder = ({ onBack, initialSchools }) => {
  // ... existing code ...
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryItem, setInquiryItem] = useState(null);

  // ... handleToggleFavorite, handlesSearch etc ...

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
  const [selectedCountry, setSelectedCountry] = useState('Lithuania');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [viewMode, setViewMode] = useState('list');

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

  const countries = ['Lithuania', 'Poland', 'Estonia', 'Latvia', 'Germany'];
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
    
    // Recommendations logic: If searching but no results, or just starting
    // (This can be expanded with more complex AI logic later)

    // If user has selected a specific Google result
    if (searchResults.length > 0) {
      return searchResults.map(result => {
        const verified = schoolsWithCoords.find(s => isFuzzyMatch(s.name, result.name));
        return verified ? { ...verified, isVerified: true } : { ...result, isGlobal: true };
      });
    }

    // Normal filtering logic
    return schoolsWithCoords.filter(school => {
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
  }, [schoolsWithCoords, selectedCountry, selectedBudget, localSearch, searchResults]);

  if (dbLoading && verifiedSchools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-20">
      <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-2xl z-30 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-2xl hover:text-primary transition-colors">←</button>
            <h2 className="text-2xl font-bold">Global School Finder</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
              className="bg-gray-50 hover:bg-gray-100 text-xs font-black px-3 py-2 rounded-xl border border-gray-100 transition-all active:scale-95 animate-in fade-in duration-300"
            >
              {viewMode === 'list' ? '🗺️ Map' : '📋 List'}
            </button>
            
            {/* Budget Dropdown */}
            <select 
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="bg-gray-50 border-none outline-none text-xs font-bold px-3 py-2 rounded-xl text-gray-500 hover:text-primary cursor-pointer transition-colors"
            >
              {budgetOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-2 shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
            <div className="p-2 text-gray-400">
              {isSearching ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              )}
            </div>
            <input
              value={localSearch}
              onChange={handleInput}
              placeholder="Search by name, city, or course..."
              className="flex-1 bg-transparent p-3 outline-none font-bold text-gray-700 placeholder:text-gray-300"
            />
            {localSearch && (
              <button 
                onClick={handleClear}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search Suggestions (Only show if key is valid and results exist) */}
          {GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY" && googleStatus === "OK" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30">
              {googleData.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full text-left p-4 hover:bg-primary/5 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3"
                >
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-400 mt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{suggestion.structured_formatting.main_text}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{suggestion.structured_formatting.secondary_text}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country Tabs (Only show if not searching results) */}
        {searchResults.length === 0 && (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
            {countries.map(country => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCountry === country 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="p-6 space-y-8 pt-44">
        {viewMode === 'map' ? (
          <div className="h-[65vh] w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <MapContainer items={combinedResults} type="school" />
          </div>
        ) : (
          <>
            {/* Smart Recommendations Section */}
        {user && favorites.length > 0 && selectedCountry === 'Lithuania' && combinedResults.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Recommended for You</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {verifiedSchools
                .filter(s => !favorites.includes(s.id) && s.country === verifiedSchools.find(fs => fs.id === favorites[0])?.country)
                .slice(0, 5)
                .map(school => (
                  <button 
                    key={school.id}
                    onClick={() => setLocalSearch(school.name)}
                    className="flex-shrink-0 w-64 bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-all text-left"
                  >
                    <SmartImage src={school.imageUrl} className="w-12 h-12 rounded-xl object-cover" type="school" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{school.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{school.country}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {selectedCountry !== 'Lithuania' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mb-8">
              <div className="w-28 h-28 bg-gradient-to-tr from-primary to-rose-400 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10 animate-bounce duration-[3000ms]">
                <span className="text-5xl">🌍</span>
              </div>
              <div className="absolute top-0 left-0 w-28 h-28 bg-primary/20 rounded-full animate-ping z-0"></div>
            </div>

            <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              {selectedCountry} is Coming Soon! 🚀
            </h3>
            <p className="text-gray-500 font-bold max-w-sm leading-relaxed mb-8 text-sm">
              We are currently vetting and verifying universities, student housing, and visa support paths for {selectedCountry} to ensure a safe, smooth transition.
            </p>

            <a
              href={getWhatsAppLink('+2348012345678', `Hi AfroEduGo! I am interested in studying in ${selectedCountry}. Please notify me when you launch there!`)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/95 text-white px-8 py-4.5 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/25 flex items-center gap-3"
            >
              <span>📲 Notify Me via WhatsApp</span>
            </a>
          </div>
        ) : combinedResults.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-10">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M12 12l0 0"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No schools found</h3>
            <p className="text-gray-400 font-medium max-w-xs mx-auto">Try adjusting your filters or search terms to find more options.</p>
            <button 
              onClick={() => {setSelectedCountry('Lithuania'); setSelectedBudget('All'); setLocalSearch("");}}
              className="mt-6 text-primary font-bold text-sm hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          combinedResults.map((school) => (
            school.isVerified || !school.isGlobal ? (
              <div key={school.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 group">
                <div className="relative overflow-hidden">
                  <SmartImage 
                    src={school.imageUrl} 
                    alt={school.name} 
                    className="h-56 w-full group-hover:scale-105 transition-transform duration-700"
                    type="school"
                  />
                  {/* Heart Button Overlay */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(school);
                    }}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                      favorites.includes(school.id) 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.includes(school.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1 9 7 2 8l5 5-2 7 7-3 7 3-2-7 5-5-7-1-3-6z"/>
                      </svg>
                      Verified Partner
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {school.country}
                    </span>
                  </div>
                  
                  <Link href={`/schools/${school.id}`} className="hover:text-primary transition-all">
                    <h3 className="text-2xl font-bold mb-1 text-gray-900 leading-tight">{school.name}</h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-4 font-medium flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {school.location}
                  </p>

                  {school.courses && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {school.courses.map(course => (
                        <span key={course} className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-gray-100">
                          {course}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Estimated Fee</span>
                      <span className="text-xl font-black text-gray-900">{school.tuition}</span>
                    </div>
                    <button
                      onClick={() => openInquiry(school)}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-center shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={school.id} className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    Global Discovery
                  </span>
                  {school.rating && (
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-lg">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1 9 7 2 8l5 5-2 7 7-3 7 3-2-7 5-5-7-1-3-6z"/>
                      </svg>
                      <span className="text-xs font-black">{school.rating}</span>
                      <span className="text-[10px] opacity-60 font-bold">({school.userRatingsTotal})</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{school.name}</h3>
                  <p className="text-sm text-gray-400 font-medium flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {school.location}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => openInquiry(school)}
                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                  >
                    Request Info
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14m-7-7 7 7-7 7"/>
                    </svg>
                  </button>
                  {school.website && (
                    <a 
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )
          ))
        )}
      </>
    )}
  </div>

      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        item={inquiryItem} 
        type="school" 
      />
    </div>
  )
}

export default SchoolFinder

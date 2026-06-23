import React, { useState, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { db } from '../firebase/config'
import { collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { getWhatsAppLink } from '../utils/whatsapp'
import SmartImage from '../components/SmartImage'
import InquiryModal from '../components/InquiryModal'
import Link from 'next/link'
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
  "berlin, germany": { lat: 52.5200, lng: 13.4050 },
  "old town, vilnius": { lat: 54.6828, lng: 25.2895 },
  "praga, warsaw": { lat: 52.2516, lng: 21.0368 },
  "charlottenburg, berlin": { lat: 52.5162, lng: 13.2982 }
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

const HousingFinder = ({ onBack, onNavigate, onOpenChat, initialHousing }) => {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const { data: liveHousing, loading, error } = useFirestore('housing');
  const housing = liveHousing.length > 0 ? liveHousing : (initialHousing || []);
  const [viewMode, setViewMode] = useState('list');

  const housingWithCoords = React.useMemo(() => {
    return housing.map(item => {
      if (item.lat && item.lng) {
        return item;
      }
      const coords = getCoordsForLocation(item.location);
      return { ...item, ...coords };
    });
  }, [housing]);

  // ... existing logic ...

  const handleStartChat = async (hostId, propertyTitle) => {
    if (!user) {
      alert("Please login to message hosts!");
      return;
    }
    const convId = await getOrCreateConversation(hostId, { propertyTitle });
    if (convId) {
      onOpenChat(convId);
    }
  };
  const [favorites, setFavorites] = useState([]);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryItem, setInquiryItem] = useState(null);

  const openInquiry = (item) => {
    setInquiryItem(item);
    setIsInquiryOpen(true);
  };

  // ... existing favorites logic ...
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

  const handleToggleFavorite = async (item) => {
    if (!user) {
      alert("Please login to save listings!");
      return;
    }

    const isFav = favorites.includes(item.id);
    if (isFav) {
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', item.id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      setFavorites(prev => prev.filter(id => id !== item.id));
    } else {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        itemId: item.id,
        itemTitle: item.title,
        itemType: 'housing',
        createdAt: new Date()
      });
      setFavorites(prev => [...prev, item.id]);
    }
  };

  if (loading && housing.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/40 backdrop-blur-2xl z-50 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:text-primary transition-colors">←</button>
          <h2 className="text-2xl font-black tracking-tight">Housing Finder</h2>
        </div>
        <button 
          onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
          className="bg-gray-50 hover:bg-gray-100 text-xs font-black px-4 py-2.5 rounded-xl border border-gray-100 transition-all active:scale-95 animate-in fade-in duration-300"
        >
          {viewMode === 'list' ? '🗺️ Map' : '📋 List'}
        </button>
      </header>

      <div className="p-4 pt-24 pb-32">
        {viewMode === 'map' ? (
          <div className="h-[65vh] w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <MapContainer items={housingWithCoords} type="housing" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {housingWithCoords.map((item) => (
              <Link 
                href={`/housing/${item.id}`} 
                key={item.id} 
                className="bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col group hover:shadow-md transition-all"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <SmartImage 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    type="housing"
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFavorite(item);
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
                      favorites.includes(item.id) 
                        ? 'bg-white/90 text-red-500 shadow-sm' 
                        : 'bg-black/20 backdrop-blur-sm text-white hover:text-red-400'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                
                <div className="p-3 flex flex-col">
                  <span className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.price}</span>
                  <h3 className="text-sm font-medium text-gray-700 leading-snug line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {item.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        item={inquiryItem} 
        type="housing" 
      />

      {/* Floating Action Button */}
      {user && (
        <button 
          onClick={() => onNavigate('add-listing')}
          className="fixed bottom-24 right-4 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm hover:scale-105 active:scale-95 transition-all z-10 border border-gray-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Sell
        </button>
      )}
    </div>
  )
}

export default HousingFinder

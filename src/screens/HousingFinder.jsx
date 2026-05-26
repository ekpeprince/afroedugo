import React, { useState, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { db } from '../firebase/config'
import { collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { getWhatsAppLink } from '../utils/whatsapp'

const HousingFinder = ({ onBack, onNavigate, onOpenChat }) => {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const { data: housing, loading, error } = useFirestore('housing');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/40 backdrop-blur-2xl z-30 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <button onClick={onBack} className="text-2xl hover:text-primary transition-colors">←</button>
        <h2 className="text-2xl font-black tracking-tight">Housing Finder</h2>
      </header>

      <div className="p-6 space-y-8 pt-24">
        {housing.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col group">
            <div className="relative overflow-hidden">
              <SmartImage 
                src={item.imageUrl} 
                alt={item.title} 
                className="h-64 w-full group-hover:scale-105 transition-transform duration-700"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item);
                }}
                className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                  favorites.includes(item.id) 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{item.title}</h3>
                <span className="text-primary font-black bg-primary/5 px-4 py-1.5 rounded-full text-sm">{item.price}</span>
              </div>
              <p className="text-gray-400 text-sm mb-8 font-bold flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {item.location}
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStartChat(item.userId || 'admin', item.title)}
                    className="flex-1 bg-primary text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    💬 Message Host
                  </button>
                  <a
                    href={getWhatsAppLink(item.whatsapp || '+3712000000', `Hi, I'm interested in: ${item.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 flex items-center justify-center bg-gray-50 text-gray-400 rounded-[1.5rem] hover:text-green-500 hover:bg-green-50 transition-all active:scale-95 border border-gray-100"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
                    </svg>
                  </a>
                </div>
                <button
                  onClick={() => openInquiry(item)}
                  className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                >
                  Standard Inquiry Form
                </button>
              </div>
            </div>
          </div>
        ))}
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
          className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default HousingFinder

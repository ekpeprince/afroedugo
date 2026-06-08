'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SmartImage from '../../../components/SmartImage';
import InquiryModal from '../../../components/InquiryModal';
import { getWhatsAppLink } from '../../../utils/whatsapp';
import { useAuth } from '../../../hooks/useAuth';
import { useChat } from '../../../hooks/useChat';
import { useGlobalState } from '../../../context/GlobalStateContext';

export default function HousingDetailClient({ item }) {
  const router = useRouter();
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const { openChat } = useGlobalState();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const handleStartChat = async () => {
    if (!user) {
      alert("Please login to message hosts!");
      router.push('/auth');
      return;
    }
    const convId = await getOrCreateConversation(item.userId || 'admin', { propertyTitle: item.title });
    if (convId) {
      openChat(convId);
    }
  };

  const handleInquiryClick = () => {
    if (!user) {
      alert("Please login to send inquiries!");
      router.push('/auth');
      return;
    }
    setIsInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative pb-32">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/40 backdrop-blur-2xl z-30 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <button 
          onClick={() => router.push('/housing')} 
          className="text-2xl hover:text-primary transition-colors"
        >
          ←
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Housing Details</h2>
        <div className="w-6"></div> {/* Spacer to center the title */}
      </header>

      {/* Hero Banner Image */}
      <div className="relative h-80 md:h-[450px] w-full pt-16">
        <SmartImage 
          src={item.imageUrl} 
          alt={item.title} 
          className="h-full w-full rounded-b-[3rem] shadow-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-b-[3rem]"></div>
        
        {/* Title overlay */}
        <div className="absolute bottom-8 left-6 right-6 text-white z-10">
          <span className="bg-secondary text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
            Student Housing
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{item.title}</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        {/* Main Details column */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-wider text-xs text-primary">About this Property</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {item.description || "Fully furnished student listing optimized for international students moving to Europe. Close to public transport and major university campuses."}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-wider text-xs text-primary">Key Amenities</h3>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold text-gray-600">
              <div className="flex items-center gap-3">🛜 High-speed Wi-Fi</div>
              <div className="flex items-center gap-3">🛋️ Fully Furnished</div>
              <div className="flex items-center gap-3">🚿 Private Shower</div>
              <div className="flex items-center gap-3">🔌 Utilities Included</div>
            </div>
          </div>
        </div>

        {/* Sidebar Price / Action column */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 text-center flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Monthly Rent</span>
            <span className="text-3xl font-black text-primary mb-6">{item.price}</span>

            <div className="w-full space-y-3">
              <button
                onClick={handleStartChat}
                className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                💬 Message Host
              </button>

              <a
                href={getWhatsAppLink(item.whatsapp || '+37060123456', `Hi, I am interested in renting: ${item.title}. Can we discuss availability?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-gray-50 text-gray-400 border border-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-green-500 hover:bg-green-50 transition-colors"
              >
                📲 Contact via WhatsApp
              </a>

              <button
                onClick={handleInquiryClick}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                Standard Inquiry Form
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Location</p>
                <p className="text-gray-800 leading-none">{item.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        item={item} 
        type="housing" 
      />
    </div>
  );
}

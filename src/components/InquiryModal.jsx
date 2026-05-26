import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const InquiryModal = ({ isOpen, onClose, item, type }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to send an inquiry");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        userId: user.uid,
        userEmail: user.email,
        studentName: user.email.split('@')[0],
        itemId: item.id,
        itemTitle: item.name || item.title,
        itemType: type, // 'school' or 'housing'
        message,
        phone,
        status: 'new',
        createdAt: serverTimestamp(),
      });

      alert("Inquiry sent successfully! The AfroEduGo team or the agent will contact you soon.");
      onClose();
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none mb-2">Request Info</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Regarding: {item.name || item.title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Quick Message</label>
            <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'school' 
                  ? "I would like to know more about the admission requirements..." 
                  : "I would like to know about the availability and viewing schedule..."
                }
                className="w-full bg-transparent p-4 outline-none text-gray-900 font-bold placeholder:text-gray-300 resize-none"
                rows="4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp / Phone Number</label>
            <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100 focus-within:border-primary/30 transition-colors">
              <input 
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 000"
                className="w-full bg-transparent p-4 outline-none text-gray-900 font-bold placeholder:text-gray-300"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-primary text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Inquiry</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] text-gray-300 font-bold">
            By sending this, you agree to allow AfroEduGo to share your contact with the provider.
          </p>
        </form>
      </div>
    </div>
  );
};

export default InquiryModal;

import React, { useState, useMemo, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { getWhatsAppLink } from '../utils/whatsapp'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'

const ServicesScreen = ({ onBack, onLogin }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'visa',
    description: '',
    whatsapp: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const { data: services, loading, error } = useFirestore('services');

  const categories = [
    { id: 'all', label: 'All', icon: '🌟', color: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { id: 'visa', label: 'Visa Support', icon: '📄', color: 'bg-amber-50', textColor: 'text-amber-600' },
    { id: 'insurance', label: 'Student Insurance', icon: '🛡️', color: 'bg-blue-50', textColor: 'text-blue-600' },
    { id: 'translation', label: 'Translation', icon: '🔤', color: 'bg-emerald-50', textColor: 'text-emerald-600' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.status === 'approved' && 
      (selectedCategory === 'all' || s.category === selectedCategory)
    );
  }, [services, selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to offer a service.");
      if (onLogin) onLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'services'), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        isVerified: false,
        createdAt: serverTimestamp()
      });
      alert("Service submitted! An admin will review it shortly.");
      setShowAddModal(false);
      setFormData({ name: '', category: 'visa', description: '', whatsapp: '' });
    } catch (err) {
      console.error("Error adding service:", err);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 max-w-5xl mx-auto">
      <header className="p-6 bg-white shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:text-primary transition-colors">←</button>
          <h2 className="text-2xl font-black tracking-tight">Services Marketplace</h2>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              if (!user && onLogin) return onLogin();
              setShowAddModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all whitespace-nowrap"
          >
            + Offer Service
          </button>
        )}
      </header>

      {/* Category Tabs */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-gray-50">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-bold text-sm ${
              selectedCategory === cat.id 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="p-6 grid grid-cols-1 gap-8">
        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-20">💼</div>
            <p className="text-gray-400 font-bold">No services in this category yet</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const catInfo = categories.find(c => c.id === service.category) || categories[1];
            return (
              <div key={service.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-50 group transition-all hover:border-primary/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${catInfo.color} ${catInfo.textColor}`}>
                      {catInfo.label}
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{service.name}</h3>
                  </div>
                  {service.isVerified && (
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1 9 7 2 8l5 5-2 7 7-3 7 3-2-7 5-5-7-1-3-6z"/>
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  {service.description}
                </p>

                <a
                  href={getWhatsAppLink(service.whatsapp, `Hi, I need help with ${service.name} for my studies.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-3xl font-bold hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Book Consultation
                </a>
              </div>
            );
          })
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Offer a Service</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Service Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1"
                  placeholder="e.g., Fast Document Translation"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1 appearance-none"
                >
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp Number</label>
                <input 
                  required
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1"
                  placeholder="e.g., +37063423845"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-medium mt-1 resize-none"
                  placeholder="Describe your service in detail..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServicesScreen

import React, { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { getWhatsAppLink } from '../utils/whatsapp'

const AdminDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [housing, setHousing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'moderation'

  useEffect(() => {
    // 1. Fetch Leads
    const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fetch Discussions
    const qPosts = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      setDiscussions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Fetch Housing for Moderation
    const qHousing = query(collection(db, 'housing'), orderBy('createdAt', 'desc'));
    const unsubscribeHousing = onSnapshot(qHousing, (snapshot) => {
      setHousing(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeLeads();
      unsubscribePosts();
      unsubscribeHousing();
    };
  }, []);

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      await updateDoc(doc(db, 'leads', leadId), { status: newStatus });
      
      // Notify the student
      if (lead && lead.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: lead.userId,
          title: '📋 Inquiry Update',
          message: `Your inquiry for "${lead.itemTitle}" is now ${newStatus.toUpperCase()}!`,
          type: 'status',
          link: 'profile',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error updating lead:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'discussions', postId));
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    }
  };

  const handleHousingAction = async (housingId, action) => {
    try {
      if (action === 'approve') {
        await updateDoc(doc(db, 'housing', housingId), { status: 'approved', isReported: false });
      } else if (action === 'reject') {
        await updateDoc(doc(db, 'housing', housingId), { status: 'rejected' });
      } else if (action === 'delete') {
        if (window.confirm("Are you sure you want to permanently delete this listing?")) {
          await deleteDoc(doc(db, 'housing', housingId));
        }
      }
    } catch (err) {
      console.error("Error updating housing:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-amber-100 text-amber-600';
      case 'done': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pb-20">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-2xl z-20 px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-xl transition-colors font-bold">←</button>
          <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">Control Room</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Ops</span>
        </div>
      </header>

      <main className="flex-1 mt-20 p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Leads</p>
             <h4 className="text-3xl font-black text-primary">{leads.length}</h4>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Posts</p>
             <h4 className="text-3xl font-black text-secondary">{discussions.length}</h4>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('leads')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Leads
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'moderation' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Moderation
          </button>
          <button 
            onClick={() => setActiveTab('housing')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'housing' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Housing
          </button>
        </div>

        {activeTab === 'leads' && (
          <div className="space-y-4">
            {leads.length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold">No leads yet.</div>
            ) : leads.map(lead => (
              <div key={lead.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status || 'new'}
                    </span>
                    <h5 className="text-lg font-bold text-gray-900 mt-2">{lead.itemTitle}</h5>
                    <p className="text-xs text-gray-400 font-bold">{lead.userEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateLeadStatus(lead.id, 'processing')}
                      className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                      title="Mark as Processing"
                    >⏳</button>
                    <button 
                      onClick={() => handleUpdateLeadStatus(lead.id, 'done')}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                      title="Mark as Done"
                    >✅</button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl italic mb-3">
                  "{lead.message || "No message provided."}"
                </p>
                {lead.phone && (
                  <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-2xl mb-4">
                    <span className="text-xs text-gray-600 font-bold">📞 {lead.phone}</span>
                    <a 
                      href={getWhatsAppLink(lead.phone, `Hi ${lead.studentName || 'there'}, I received your inquiry for "${lead.itemTitle}" on AfroEduGo. How can I help you?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10 hover:scale-105 active:scale-95"
                    >
                      💬 Chat on WhatsApp
                    </a>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[10px] text-gray-300 font-bold uppercase">Ref: {lead.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{lead.createdAt?.toDate()?.toLocaleString() || 'Recent'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {discussions.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">{post.user}</span>
                    <span className="text-[10px] text-gray-300">{post.createdAt?.toDate()?.toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{post.text}</p>
                  {post.imageUrl && <div className="text-[10px] text-primary font-bold">🖼️ Has Image</div>}
                </div>
                <button 
                   onClick={() => handleDeletePost(post.id)}
                   className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >🗑️</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'housing' && (
          <div className="space-y-4">
            {housing.filter(h => h.status === 'pending' || h.isReported).length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold">No pending or reported housing listings.</div>
            ) : housing.filter(h => h.status === 'pending' || h.isReported).map(item => (
              <div key={item.id} className={`bg-white p-6 rounded-[2rem] shadow-lg border transition-all flex flex-col gap-4 ${item.isReported ? 'border-red-200 bg-red-50/10' : 'border-gray-50 hover:border-primary/20'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    {item.isReported ? (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-600 mb-2 inline-block">
                        ⚠️ Reported
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-600 mb-2 inline-block">
                        ⏳ Pending Approval
                      </span>
                    )}
                    <h5 className="text-lg font-bold text-gray-900">{item.title}</h5>
                    <p className="text-xs text-gray-500 font-bold mb-1">{item.price} • {item.location}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Posted by: {item.userEmail}</p>
                  </div>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded-xl shadow-sm border border-gray-100" />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => handleHousingAction(item.id, 'approve')}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase hover:bg-emerald-100"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    onClick={() => handleHousingAction(item.id, 'reject')}
                    className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs uppercase hover:bg-amber-100"
                  >
                    🚫 Hide
                  </button>
                  <button 
                    onClick={() => handleHousingAction(item.id, 'delete')}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-100"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard

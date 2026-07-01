import React, { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { getWhatsAppLink } from '../utils/whatsapp'
import { useGlobalState } from '../context/GlobalStateContext'

const AdminDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const { openChat } = useGlobalState();
  const [leads, setLeads] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [housing, setHousing] = useState([]);
  const [services, setServices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'moderation', 'housing', 'services', 'schools', 'expert_chats', 'settings'

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

    // 3. Fetch Reported Comments
    const qComments = query(collection(db, 'comments'), where('isReported', '==', true));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      setReportedComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Fetch Housing for Moderation
    const qHousing = query(collection(db, 'housing'), orderBy('createdAt', 'desc'));
    const unsubscribeHousing = onSnapshot(qHousing, (snapshot) => {
      setHousing(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Fetch Services for Moderation
    const qServices = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 6. Fetch Schools
    const qSchools = query(collection(db, 'schools'));
    const unsubscribeSchools = onSnapshot(qSchools, (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 7. Fetch Support Chats
    const qSupport = query(collection(db, 'conversations'), where('participants', 'array-contains', 'admin_support'), orderBy('updatedAt', 'desc'));
    const unsubscribeSupport = onSnapshot(qSupport, (snapshot) => {
      setSupportChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeLeads();
      unsubscribePosts();
      unsubscribeComments();
      unsubscribeHousing();
      unsubscribeServices();
      unsubscribeSchools();
      unsubscribeSupport();
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

  const handleUpdateHousingStatus = async (housingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'housing', housingId), { status: newStatus });
      const item = housing.find(h => h.id === housingId);
      if (item && item.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: item.userId,
          title: '🏠 Listing Update',
          message: `Your housing listing "${item.title}" has been ${newStatus}.`,
          type: 'status',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error updating housing status:", err);
    }
  };

  const handleUpdateServiceStatus = async (serviceId, newStatus) => {
    try {
      await updateDoc(doc(db, 'services', serviceId), { status: newStatus });
      const item = services.find(s => s.id === serviceId);
      if (item && item.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: item.userId,
          title: '💼 Service Listing Update',
          message: `Your service "${item.name}" has been ${newStatus}.`,
          type: 'status',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error updating service status:", err);
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

  const handleDismissPostReport = async (postId) => {
    try {
      await updateDoc(doc(db, 'discussions', postId), { isReported: false });
    } catch (err) {
      console.error("Error dismissing post report:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (err) {
        console.error("Error deleting comment:", err);
      }
    }
  };

  const handleDismissCommentReport = async (commentId) => {
    try {
      await updateDoc(doc(db, 'comments', commentId), { isReported: false });
    } catch (err) {
      console.error("Error dismissing comment report:", err);
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
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Expert Chats</p>
             <h4 className="text-3xl font-black text-secondary">{supportChats.length}</h4>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('leads')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Leads
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'moderation' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Moderation
          </button>
          <button 
            onClick={() => setActiveTab('housing')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'housing' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Housing
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'services' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Services
          </button>
          <button 
            onClick={() => setActiveTab('schools')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'schools' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Schools
          </button>
          <button 
            onClick={() => setActiveTab('expert_chats')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'expert_chats' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Settings
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

        {activeTab === 'moderation' && (() => {
          const reportedPosts = discussions.filter(p => p.isReported);
          
          return (
            <div className="space-y-8">
              {/* Flagged Section */}
              <div className="bg-red-50/10 border border-red-100 rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-lg font-black text-red-600 mb-6 flex items-center gap-2">
                  ⚠️ Reported Items (Needs Action)
                </h3>

                {reportedPosts.length === 0 && reportedComments.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-3xl border border-gray-150 p-6">
                    <span className="text-3xl mb-2 block">✨</span>
                    <p className="text-gray-500 font-bold text-sm">Clean slate! No flagged posts or comments to review.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Reported Posts */}
                    {reportedPosts.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-500 ml-2">Flagged Posts ({reportedPosts.length})</h4>
                        {reportedPosts.map(post => (
                          <div key={post.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 text-sm">{post.user}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{post.createdAt?.toDate()?.toLocaleString() || 'Recent'}</span>
                              </div>
                              <p className="text-gray-800 text-sm font-medium leading-relaxed break-words">{post.text}</p>
                              {post.imageUrl && <div className="text-[10px] text-primary font-bold mt-1">🖼️ Has Image</div>}
                            </div>
                            <div className="flex gap-2 shrink-0 self-end sm:self-center">
                              <button 
                                onClick={() => handleDismissPostReport(post.id)}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all"
                                title="Dismiss Report"
                              >
                                ✓ Keep Post
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                title="Delete Post"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reported Comments */}
                    {reportedComments.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-500 ml-2">Flagged Comments ({reportedComments.length})</h4>
                        {reportedComments.map(comment => (
                          <div key={comment.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 text-sm">{comment.userName}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{comment.createdAt?.toDate()?.toLocaleString() || 'Recent'}</span>
                              </div>
                              <p className="text-gray-850 text-sm font-medium leading-relaxed break-words">{comment.text}</p>
                            </div>
                            <div className="flex gap-2 shrink-0 self-end sm:self-center">
                              <button 
                                onClick={() => handleDismissCommentReport(comment.id)}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all"
                                title="Dismiss Report"
                              >
                                ✓ Keep Comment
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                title="Delete Comment"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Browse All Section */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-gray-900 ml-2">
                  🌐 Browse All Posts ({discussions.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {discussions.map(post => (
                    <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-300 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 text-sm">{post.user}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{post.createdAt?.toDate()?.toLocaleDateString()}</span>
                          {post.isReported && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 text-red-600 rounded">
                              ⚠️ Reported
                            </span>
                          )}
                        </div>
                        <p className="text-gray-650 text-sm font-medium leading-relaxed break-words line-clamp-3">{post.text}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shrink-0 self-end sm:self-center"
                        title="Delete Post"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

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
                    onClick={() => handleUpdateHousingStatus(item.id, 'approved')}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase hover:bg-emerald-100"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateHousingStatus(item.id, 'rejected')}
                    className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs uppercase hover:bg-amber-100"
                  >
                    🚫 Hide
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Delete this listing?")) {
                        deleteDoc(doc(db, 'housing', item.id));
                      }
                    }}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-100"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            {services.filter(s => s.status === 'pending').length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold">No pending service listings.</div>
            ) : services.filter(s => s.status === 'pending').map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-amber-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      Pending Approval
                    </span>
                    <h5 className="text-lg font-bold text-gray-900 mt-2">{item.name}</h5>
                    <p className="text-xs text-gray-400 font-bold">{item.category} • {item.whatsapp}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateServiceStatus(item.id, 'approved')}
                      className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:bg-emerald-200 transition-colors"
                      title="Approve"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => handleUpdateServiceStatus(item.id, 'rejected')}
                      className="bg-red-100 text-red-700 p-2 rounded-xl hover:bg-red-200 transition-colors"
                      title="Reject"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="space-y-6">
            <button
              onClick={async () => {
                const name = prompt("Enter University Name:");
                if (!name) return;
                const location = prompt("Enter Location (e.g., Vilnius, Lithuania):", "Vilnius, Lithuania");
                const website = prompt("Enter Website URL:", "https://example.com");
                const price = prompt("Enter Tuition Fee (e.g., €3000):", "€3000");
                try {
                  await addDoc(collection(db, 'schools'), {
                    name,
                    location,
                    website,
                    price,
                    rating: 4.5,
                    createdAt: serverTimestamp()
                  });
                  alert("School added!");
                } catch(e) {
                  console.error(e);
                  alert("Error adding school");
                }
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              + Add New School
            </button>
            <div className="space-y-4">
              {schools.map(school => (
                <div key={school.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-gray-900">{school.name}</h5>
                    <p className="text-xs text-gray-500 font-bold">{school.location} • {school.price || 'Contact for price'}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm("Delete this school?")) {
                        deleteDoc(doc(db, 'schools', school.id));
                      }
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expert_chats' && (
          <div className="space-y-4">
            {supportChats.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold">No active expert chats.</div>
            ) : supportChats.map(chat => {
              const otherUserId = chat.participants.find(id => id !== 'admin_support');
              return (
                <button 
                  key={chat.id}
                  onClick={() => {
                     openChat(chat.id);
                  }}
                  className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-150 flex items-center justify-between hover:border-primary transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl">👤</div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-none mb-1">User ID: {otherUserId ? otherUserId.slice(0,6) : 'Unknown'}</h4>
                      <p className="text-gray-400 text-sm font-medium line-clamp-1">{chat.lastMessage || 'Started conversation'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                    <span className="text-primary font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-50">
              <h5 className="font-black text-gray-900 text-lg mb-2">Database Tools</h5>
              <p className="text-gray-500 text-sm mb-6">Seed the database with sample data for initial launch. Only run this once to populate an empty app.</p>
              
              <button
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to seed the database with sample data?")) return;
                  
                  try {
                    // Seed School
                    await addDoc(collection(db, 'schools'), {
                      name: "Vilnius University",
                      location: "Vilnius, Lithuania",
                      website: "https://vu.lt",
                      price: "€3,200",
                      rating: 4.8,
                      createdAt: serverTimestamp()
                    });

                    // Seed Housing
                    await addDoc(collection(db, 'housing'), {
                      title: "Modern Student Studio",
                      location: "Vilnius City Center",
                      price: "€350/mo",
                      description: "A lovely studio perfect for a student, 15 mins to campus.",
                      userId: user.uid,
                      status: "approved",
                      isReported: false,
                      createdAt: serverTimestamp()
                    });

                    // Seed Service
                    await addDoc(collection(db, 'services'), {
                      name: "Premium Visa Support",
                      category: "visa",
                      description: "We help you get your TRC fast and easy.",
                      whatsapp: "+37063423845",
                      userId: user.uid,
                      status: "approved",
                      createdAt: serverTimestamp()
                    });

                    // Seed Community Post
                    await addDoc(collection(db, 'discussions'), {
                      text: "Hello everyone! I just arrived in Vilnius. Where is the best place to get a student bus pass?",
                      user: "NewStudent",
                      userId: user.uid,
                      category: "General",
                      createdAt: serverTimestamp(),
                      likes: [],
                      commentCount: 0
                    });

                    alert("Database successfully seeded with sample data!");
                  } catch (e) {
                    console.error(e);
                    alert("Error seeding database.");
                  }
                }}
                className="py-3 px-6 bg-emerald-50 text-emerald-600 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-100 transition-colors"
              >
                🌱 Seed Database
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard

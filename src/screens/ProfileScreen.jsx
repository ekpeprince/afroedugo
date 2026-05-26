import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useFirestore } from '../hooks/useFirestore'
import { useProfile } from '../hooks/useProfile'
import { db } from '../firebase/config'
import { doc, deleteDoc } from 'firebase/firestore'

const ProfileScreen = ({ onBack, onLogout }) => {
  const { user, logout } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ country: '', major: '', bio: '' });

  // ... favorites and listings logic ...
  const { data: favorites, loading: favLoading } = useFirestore('favorites');
  const userFavorites = favorites.filter(f => f.userId === user?.uid);

  const { data: housing, loading: housingLoading } = useFirestore('housing');
  const userListings = housing.filter(h => h.userId === user?.uid);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const handleDeleteFavorite = async (id) => {
    if (window.confirm("Remove from favorites?")) {
      await deleteDoc(doc(db, 'favorites', id));
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing? it will be permanently removed from the marketplace.")) {
      await deleteDoc(doc(db, 'housing', id));
    }
  };

  const startEdit = () => {
    setEditData({
      country: profile?.country || '',
      major: profile?.major || '',
      bio: profile?.bio || ''
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const { data: leads, loading: leadsLoading } = useFirestore('leads');
  const userInquiries = leads.filter(l => l.userId === user?.uid);

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <header className="p-8 bg-gray-900/90 backdrop-blur-2xl text-white rounded-b-[3rem] shadow-2xl shadow-gray-200/20 mb-8 sticky top-0 z-20 border-b border-white/5">
        <button onClick={onBack} className="text-2xl mb-8 opacity-60 hover:opacity-100 transition-opacity">←</button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/20 rounded-[2rem] overflow-hidden flex items-center justify-center text-3xl font-black text-primary border-4 border-white/10 shadow-inner">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-none mb-2">{profile?.displayName || user?.email?.split('@')[0]}</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Active Now • {user?.email}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={startEdit}
            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="p-8 space-y-12">
        {/* Admin Access (Eventually gate by user.role === 'admin') */}
        <button 
          onClick={() => onNavigate('admin')}
          className="w-full bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-slate-200 border border-slate-800 active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">🛡️</div>
            <div className="text-left">
              <h4 className="text-white font-black leading-tight">Control Room</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ops & Moderation</p>
            </div>
          </div>
          <div className="text-slate-500 group-hover:translate-x-1 transition-transform">→</div>
        </button>

        {/* Viral Growth Loop (Join Me) */}
        <button 
          onClick={onShowViralModal}
          className="w-full bg-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-gray-200 border border-gray-100 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12">
            🚀
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl">✨</div>
            <div className="text-left">
              <h4 className="text-gray-900 font-black leading-tight">Bring Your Friends</h4>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Viral Growth Referral</p>
            </div>
          </div>
          <div className="text-primary font-black text-xs uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">Invite Now</div>
        </button>

        {/* Social Profile Section */}
        {isEditing ? (
          <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black mb-6">Edit Social Profile</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Country of Origin</label>
                <input 
                  value={editData.country}
                  onChange={e => setEditData({...editData, country: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1"
                  placeholder="e.g. Nigeria"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Study Program / Major</label>
                <input 
                  value={editData.major}
                  onChange={e => setEditData({...editData, major: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1"
                  placeholder="e.g. IT Engineering"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Short Bio</label>
                <textarea 
                  value={editData.bio}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold mt-1 resize-none"
                  rows="3"
                  placeholder="Tell other students about yourself..."
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400">Cancel</button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </section>
        ) : profile && (profile.country || profile.major || profile.bio) && (
          <section className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
               </svg>
             </div>
             <div className="relative z-10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Verified Social Profile</h3>
               <div className="flex flex-wrap gap-2 mb-6">
                 {profile.country && <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-black border border-white/5">{profile.country}</span>}
                 {profile.major && <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-black border border-white/5">{profile.major}</span>}
               </div>
               <p className="text-gray-300 font-bold italic text-sm leading-relaxed max-w-sm">
                 "{profile.bio || 'No bio set yet. Start telling your story!'}"
               </p>
             </div>
          </section>
        )}
        {/* Inquiries Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-black text-gray-900">Inquiry History</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-3 py-1 rounded-lg">
              {userInquiries.length} Sent
            </span>
          </div>

          {leadsLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-4 border-secondary/20 border-t-secondary rounded-full"></div>
            </div>
          ) : userInquiries.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-gray-400 font-bold text-sm leading-tight">No inquiries sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userInquiries.map((lead) => (
                <div key={lead.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-gray-900 leading-none">{lead.itemTitle}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${lead.status === 'new' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium line-clamp-1 mb-2">"{lead.message}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                      {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                      {lead.itemType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Favorites Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-black text-gray-900">My Favorites</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {userFavorites.length} Items
            </span>
          </div>

          {favLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full"></div>
            </div>
          ) : userFavorites.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">❤️</div>
              <p className="text-gray-400 font-bold text-sm leading-tight">Your favorite list is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userFavorites.map((fav) => (
                <div key={fav.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${fav.itemType === 'school' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                      {fav.itemType === 'school' ? '🎓' : '🏠'}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 leading-none mb-1">{fav.itemTitle}</h4>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{fav.itemType}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFavorite(fav.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Listings Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-black text-gray-900">My Listings</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-3 py-1 rounded-lg">
              {userListings.length} Active
            </span>
          </div>

          {housingLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-4 border-secondary/20 border-t-secondary rounded-full"></div>
            </div>
          ) : userListings.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">🏠</div>
              <p className="text-gray-400 font-bold text-sm leading-tight">No active property listings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userListings.map((listing) => (
                <div key={listing.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={listing.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-black text-gray-900 leading-none mb-1">{listing.title}</h4>
                      <p className="text-primary font-bold text-[10px]">{listing.price}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteListing(listing.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pt-12 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-500 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-red-100 transition-all active:scale-95"
          >
            Logout From AfroEduGo
          </button>
        </section>
      </div>
    </div>
  )
}

export default ProfileScreen

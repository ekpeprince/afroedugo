import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('incoming');
  const [isSaving, setIsSaving] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || (user?.email?.split('@')[0] || ''));
      setBio(profile.bio || '');
      setMajor(profile.major || '');
      setCountry(profile.country || '');
      setRole(profile.role || 'incoming');
    }
  }, [profile, user, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalPhotoUrl = profile?.photoURL || '';

      if (avatarFile) {
        const imageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, avatarFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);
      }

      await updateProfile({
        displayName,
        bio,
        major,
        country,
        role,
        photoURL: finalPhotoUrl
      });

      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-400 border-4 border-white shadow-md transition-all group-hover:ring-4 ring-primary/30">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : profile?.photoURL || user?.photoURL ? (
                  <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0]?.toUpperCase() || '👤'
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-2xl">📷</span>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Change Photo</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Display Name</label>
              <input 
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all font-medium"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all font-medium resize-none"
                placeholder="A short bio about yourself..."
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
                <input 
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all font-medium"
                  placeholder="e.g. Nigeria"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Major</label>
                <input 
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all font-medium"
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Student Status</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${role === 'incoming' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="incoming" 
                    checked={role === 'incoming'} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="hidden" 
                  />
                  <span className="font-bold">✈️ Incoming</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${role === 'current' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="current" 
                    checked={role === 'current'} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="hidden" 
                  />
                  <span className="font-bold">🎓 Current</span>
                </label>
              </div>
            </div>

          </div>

          <div className="mt-8">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

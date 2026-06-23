import React, { useState, useRef, useEffect } from 'react';
import { db, storage, GOOGLE_MAPS_API_KEY } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { useLoadScript } from '@react-google-maps/api';

const AddListing = ({ onBack }) => {
  const { user, loading: authLoading } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    whatsapp: '',
    description: ''
  });

  const geocodeAddress = (address) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        resolve(null);
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ lat, lng });
        } else {
          console.warn('Geocoding failed for address:', address, status);
          resolve(null);
        }
      });
    });
  };
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Security: If not logged in after auth finishes loading, we shouldn't be here
  // But we'll handle it gracefully in the UI too
  useEffect(() => {
    if (!authLoading && !user) {
      alert("Please login to add a listing");
      onBack();
    }
  }, [user, authLoading, onBack]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max width 1200px
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/webp', 0.85);
        };
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to publish a listing');
      return;
    }
    if (!image) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    try {
      // 1. Optimize Image
      const optimizedBlob = await optimizeImage(image);

      // 2. Upload to Firebase Storage
      const fileName = `housing_${user.uid}_${Date.now()}.webp`;
      const storageRef = ref(storage, `housing_images/${fileName}`);
      await uploadBytes(storageRef, optimizedBlob);
      const imageUrl = await getDownloadURL(storageRef);

      // 3. Geocode location
      let coords = null;
      if (isLoaded) {
        try {
          coords = await geocodeAddress(formData.location);
        } catch (err) {
          console.warn('Geocoding warning:', err);
        }
      }

      // 4. Save to Firestore
      await addDoc(collection(db, 'housing'), {
        ...formData,
        imageUrl,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        ...(coords || {})
      });

      alert('Listing submitted successfully! It will appear on the feed once approved by an admin.');
      onBack();
    } catch (error) {
      console.error('Error adding listing:', error);
      alert('Failed to add listing. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFE] p-6 pb-20">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold">List Your Property</h1>
        <div className="w-10"></div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Picker - Marketplace Style */}
        <div className="flex gap-4 items-center">
          <div 
            onClick={() => fileInputRef.current.click()}
            className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 mb-1">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="text-[10px] font-bold text-gray-500">Add Photo</span>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
          {!preview && (
            <p className="text-sm text-gray-400 font-medium">Add a photo to attract more tenants.</p>
          )}
        </div>

        {/* Form Fields - Clean List Style */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-200">
            <input
              type="text"
              name="title"
              placeholder="Title (e.g., Single Room near SMK)"
              className="w-full p-4 outline-none font-medium text-gray-900"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="border-b border-gray-200">
            <input
              type="text"
              name="price"
              placeholder="Price (€/mo)"
              className="w-full p-4 outline-none font-medium text-gray-900"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="border-b border-gray-200">
            <input
              type="text"
              name="location"
              placeholder="Location (e.g., Vilnius, Lithuania)"
              className="w-full p-4 outline-none font-medium text-gray-900"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="border-b border-gray-200">
            <input
              type="text"
              name="whatsapp"
              placeholder="WhatsApp Number"
              className="w-full p-4 outline-none font-medium text-gray-900"
              required
              onChange={handleInputChange}
            />
          </div>
          <div>
            <textarea
              name="description"
              placeholder="Description"
              rows="5"
              className="w-full p-4 outline-none font-medium text-gray-900 resize-none"
              required
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-[#1877F2] text-white py-4 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish Listing</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddListing;

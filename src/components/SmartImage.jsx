import React, { useState } from 'react';
import Image from 'next/image';

const SmartImage = ({ src, alt, className, type = 'general', fallbackSrc = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFallbackSrc = () => {
    if (fallbackSrc) return fallbackSrc;
    if (type === 'school') {
      return 'https://images.unsplash.com/photo-1498243691581-b148c5c44725?q=80&w=800&auto=format&fit=crop';
    }
    if (type === 'housing') {
      return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop';
  };

  // Fallback if no src is provided
  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xs ${className}`}>
        <img
          src={getFallbackSrc()}
          alt="Default Placeholder"
          className="w-full h-full object-cover absolute inset-0 opacity-60"
        />
        <span className="relative z-10 font-bold">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {!error ? (
        <Image
          src={src}
          alt={alt || "Image"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : (
        <img
          src={getFallbackSrc()}
          alt={alt || "Fallback Placeholder"}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default SmartImage;

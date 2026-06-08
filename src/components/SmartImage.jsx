import React, { useState } from 'react';
import Image from 'next/image';

const SmartImage = ({ src, alt, className }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fallback if no src is provided
  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xs ${className}`}>
        No Image
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
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-2">
          Image failed to load
        </div>
      )}
    </div>
  );
};

export default SmartImage;

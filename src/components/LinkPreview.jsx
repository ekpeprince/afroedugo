import React, { useState, useEffect } from 'react';

export default function LinkPreview({ url }) {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        // Using Microlink API which is free and reliable for link previews
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Failed to fetch preview');
        
        const json = await response.json();
        if (json.status === 'success' && isMounted) {
          setPreviewData(json.data);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error("Link preview error:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (url) fetchPreview();

    return () => { isMounted = false; };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center p-4 animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4 shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !previewData || (!previewData.title && !previewData.description)) {
    // If we can't get a meaningful preview, just render nothing, the original link in the text is enough
    return null; 
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-3 block border border-gray-200 rounded-xl bg-white overflow-hidden hover:bg-gray-50 transition-colors shadow-sm group"
    >
      {previewData.image?.url && (
        <div className="w-full h-48 bg-gray-100 border-b border-gray-200 overflow-hidden">
          <img 
            src={previewData.image.url} 
            alt={previewData.title || "Link preview"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{previewData.title || url}</h4>
        {previewData.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{previewData.description}</p>
        )}
        <div className="flex items-center gap-2">
          {previewData.logo?.url && (
            <img src={previewData.logo.url} alt="Favicon" className="w-4 h-4 rounded" />
          )}
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{previewData.publisher || new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
}

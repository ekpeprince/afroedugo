'use client';

import React, { useState } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import Link from 'next/link';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px'
};

// Premium minimalist map theme settings
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#4f5b66" }]
    },
    {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [{ "color": "#f5f7fa" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "water",
      "elementType": "all",
      "stylers": [{ "color": "#e4ebf5" }]
    }
  ]
};

export default function MapContainer({ items = [], type = 'school', initialCenter = null }) {
  const [activeMarker, setActiveMarker] = useState(null);

  // Filter out any items without valid coordinates
  const validItems = items.filter(item => item.lat !== undefined && item.lng !== undefined && item.lat !== null && item.lng !== null);

  // Compute map center
  const center = initialCenter || (validItems.length > 0
    ? { lat: Number(validItems[0].lat), lng: Number(validItems[0].lng) }
    : { lat: 54.6872, lng: 25.2797 }); // Default fallback (Vilnius)

  const handleMarkerClick = (item) => {
    setActiveMarker(item);
  };

  const handleInfoWindowClose = () => {
    setActiveMarker(null);
  };

  return (
    <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/50">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={validItems.length > 1 ? 5 : 11}
        center={center}
        options={mapOptions}
      >
        {validItems.map((item) => (
          <MarkerF
            key={item.id}
            position={{ lat: Number(item.lat), lng: Number(item.lng) }}
            onClick={() => handleMarkerClick(item)}
            icon={{
              url: type === 'school'
                ? 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="%234F46E5"><circle cx="12" cy="12" r="10" fill="%234F46E5" opacity="0.15"/><circle cx="12" cy="12" r="6" fill="%234F46E5" stroke="white" stroke-width="2"/><path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" transform="scale(0.4) translate(18, 18)"/></svg>'
                : 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="%23EC4899"><circle cx="12" cy="12" r="10" fill="%23EC4899" opacity="0.15"/><circle cx="12" cy="12" r="6" fill="%23EC4899" stroke="white" stroke-width="2"/><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" transform="scale(0.4) translate(18, 18)"/></svg>',
              scaledSize: { width: 36, height: 36 },
              origin: { x: 0, y: 0 },
              anchor: { x: 18, y: 18 }
            }}
          />
        ))}

        {activeMarker && (
          <InfoWindowF
            position={{ lat: Number(activeMarker.lat), lng: Number(activeMarker.lng) }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-[200px] font-sans">
              {activeMarker.imageUrl && (
                <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                  <img 
                    src={activeMarker.imageUrl} 
                    alt={activeMarker.name || activeMarker.title} 
                    className="object-cover w-full h-full" 
                  />
                </div>
              )}
              <h5 className="font-black text-gray-900 text-sm leading-tight mb-1">
                {activeMarker.name || activeMarker.title}
              </h5>
              <p className="text-[10px] text-gray-400 font-bold mb-2">{activeMarker.location}</p>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-black text-primary">
                  {activeMarker.tuition || activeMarker.price}
                </span>
                <Link
                  href={type === 'school' ? `/schools/${activeMarker.id}` : `/housing/${activeMarker.id}`}
                  className="text-[9px] font-black uppercase tracking-wider bg-gray-900 text-white px-2.5 py-1.5 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  View Details
                </Link>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}

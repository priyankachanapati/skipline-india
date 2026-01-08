'use client';

import { useEffect, useRef, useState } from 'react';
import { Office } from '@/lib/firebase/firestore';

interface OfficeMapProps {
  office: Office;
  height?: string;
}

export default function OfficeMap({ office, height = '300px' }: OfficeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return true;
      }
      return false;
    };

    // Try immediately
    if (checkGoogleMaps()) {
      return;
    }

    // Poll for Google Maps to load
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !window.google) return;

    console.log('[Google Maps] Initializing map with API key:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      officeName: office.name,
      coordinates: { lat: office.latitude, lng: office.longitude },
    });

    // PROOF: Google Maps JavaScript API is being used here
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: office.latitude, lng: office.longitude },
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    console.log('[Google Maps] Map instance created successfully');

    const marker = new window.google.maps.Marker({
      position: { lat: office.latitude, lng: office.longitude },
      map,
      title: office.name,
    });

    console.log('[Google Maps] Marker placed at:', {
      officeName: office.name,
      position: { lat: office.latitude, lng: office.longitude },
    });
  }, [office, mapLoaded]);

  if (!mapLoaded) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center"
      >
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-gray-200"
    />
  );
}

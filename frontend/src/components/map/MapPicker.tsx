"use client";

import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, Crosshair, Search, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "@/lib/leafletSetup";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

interface LocationResult {
  lat: string;
  lng: string;
  display_name: string;
}

interface MapPickerProps {
  onLocationSelect: (location: LocationResult) => void;
  selectedLocation: LocationResult | null;
}

function LocationMarker({ position, onMapClick }: {
  position: [number, number] | null;
  onMapClick: (latlng: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!position) return null;
  return <Marker position={position} />;
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, selectedLocation }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReversing(true);
    try {
      const res = await fetch(
        `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(displayName);
      onLocationSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6), display_name: displayName });
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallback);
      onLocationSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6), display_name: fallback });
    } finally {
      setIsReversing(false);
    }
  }, [onLocationSelect]);

  const handleMapClick = useCallback((latlng: [number, number]) => {
    setPosition(latlng);
    reverseGeocode(latlng[0], latlng[1]);
  }, [reverseGeocode]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);
        reverseGeocode(latlng[0], latlng[1]);
        setIsLocating(false);
        toast.success("Location detected");
      },
      () => {
        setIsLocating(false);
        toast.error("Could not detect location. Please click on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(
        data.map((item: any) => ({
          lat: item.lat,
          lng: item.lon,
          display_name: item.display_name,
        }))
      );
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const selectSearchResult = useCallback((result: LocationResult) => {
    const latlng: [number, number] = [parseFloat(result.lat), parseFloat(result.lng)];
    setPosition(latlng);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    onLocationSelect(result);
  }, [onLocationSelect]);

  useEffect(() => {
    if (selectedLocation && !position) {
      const latlng: [number, number] = [parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lng)];
      setPosition(latlng);
      setAddress(selectedLocation.display_name);
    }
  }, [selectedLocation, position]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); }}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
            placeholder="Search location by address..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-sm focus:outline-none focus:border-primary"
          />
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        </div>
        <button
          onClick={searchLocation}
          disabled={isSearching || !searchQuery.trim()}
          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
        <button
          onClick={detectLocation}
          disabled={isLocating}
          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
          GPS
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-black/80 border border-black/10 dark:border-white/20 rounded-xl overflow-hidden shadow-lg">
          {searchResults.map((result, i) => (
            <button
              key={i}
              onClick={() => selectSearchResult(result)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 border-b border-black/5 dark:border-white/10 last:border-0 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 inline mr-2 text-primary flex-shrink-0" />
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="h-64 md:h-80 rounded-xl overflow-hidden border border-black/10 dark:border-white/20 relative">
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 15 : 12}
          className="h-full w-full z-0"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onMapClick={handleMapClick} />
          {position && <FlyTo center={position} />}
        </MapContainer>
      </div>

      {isReversing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Getting address...
        </div>
      )}

      {address && !isReversing && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary">Selected Location</p>
            <p className="text-muted-foreground text-xs mt-0.5">{address}</p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client"

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PickupAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressSubmit: (address: string, lat: number, lng: number) => void;
  loading: boolean;
}

// Replace the function definition with correct destructuring
export function PickupAddressDialog(props: PickupAddressDialogProps) {
  const { open, onOpenChange, onAddressSubmit, loading } = props;
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<any>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAddress("");
      setLat(null);
      setLng(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open]);

  // Geocode address when selected
  const handleSelectSuggestion = async (suggestion: any) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    if (suggestion.lat && suggestion.lon) {
      setLat(Number(suggestion.lat));
      setLng(Number(suggestion.lon));
      // Pan map to new location
      if (mapRef.current) {
        mapRef.current.setView([Number(suggestion.lat), Number(suggestion.lon)], 16);
      }
    }
  };

  // Fetch address suggestions
  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setShowSuggestions(true);
    if (value.length > 3) {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=IN&addressdetails=1&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = () => {
    if (address && lat !== null && lng !== null) {
      onAddressSubmit(address, lat, lng);
    } else {
      alert("Please provide a valid address and select from suggestions.");
    }
  };

  const defaultPosition: L.LatLngExpression = [lat ?? 28.6139, lng ?? 77.2090]; // Use selected or default

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Pickup Address</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <div className="col-span-3">
              <Input
                id="address"
                value={address}
                onChange={handleAddressChange}
                autoComplete="off"
                className="w-full"
                onFocus={() => setShowSuggestions(true)}
              />
            </div>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="z-10 bg-white border border-gray-200 w-full max-h-40 overflow-y-auto rounded shadow mb-2">
              {suggestions.map((s, idx) => (
                <li
                  key={s.place_id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
          <div className="w-full h-[300px]">
            <MapContainer
              center={defaultPosition}
              zoom={lat && lng ? 16 : 13}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {lat !== null && lng !== null && (
                <Marker position={[lat, lng]} icon={redIcon} />
              )}
            </MapContainer>
          </div>
          {lat !== null && lng !== null && (
            <p className="text-sm text-muted-foreground">
              Selected: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Confirm Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

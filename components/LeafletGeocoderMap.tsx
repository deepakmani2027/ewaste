import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";


interface LeafletGeocoderMapProps {
  onSelect: (address: string) => void;
  address?: string;
}

export default function LeafletGeocoderMap({ onSelect, address }: LeafletGeocoderMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Remove any existing map instance for this DOM node
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const map = L.map("leaflet-map").setView([28.6139, 77.209], 11); // Default: Delhi
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // @ts-ignore
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
    })
      .on("markgeocode", function (e: any) {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest(),
        ]).addTo(map);
        map.fitBounds(poly.getBounds());
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker(e.geocode.center, { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] }) }).addTo(map);
        onSelect(e.geocode.name);
      })
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onSelect]);

  // Update map and marker when address prop changes
  useEffect(() => {
    if (!address || !mapRef.current) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=IN&q=${encodeURIComponent(address)}`)
      .then(res => res.json())
      .then(results => {
        if (results && results[0] && mapRef.current) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          mapRef.current.setView([lat, lon], 15);
          if (markerRef.current) markerRef.current.remove();
          markerRef.current = L.marker([lat, lon], { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] }) }).addTo(mapRef.current);
        }
      });
  }, [address]);

  return (
    <div id="leaflet-map" style={{ height: 300, width: "100%", borderRadius: 8, marginTop: 8 }} />
  );
}

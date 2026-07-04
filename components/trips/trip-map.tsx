"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  kind: "destination" | "place";
};

// Hand-rolled pin (divIcon) so we don't depend on Leaflet's marker PNG assets.
function pin(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -14],
  });
}

export function TripMap({ points }: { points: MapPoint[] }) {
  const located = points.filter(
    (p): p is MapPoint & { latitude: number; longitude: number } =>
      p.latitude != null && p.longitude != null,
  );

  if (located.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] text-center text-[#7a7a7a]">
        No mapped locations yet — add places with recognizable names and
        they&apos;ll appear here.
      </div>
    );
  }

  const center: [number, number] = [located[0].latitude, located[0].longitude];

  return (
    <MapContainer
      center={center}
      zoom={located.length > 1 ? 5 : 9}
      scrollWheelZoom
      style={{ height: 420, width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={pin(p.kind === "destination" ? "#3f5f97" : "#5a7d2e")}
        >
          <Popup>{p.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

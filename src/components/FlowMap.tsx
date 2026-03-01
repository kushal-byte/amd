import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ItineraryItem } from '../types';
import { useEffect, useState } from 'react';
import { Crosshair, Loader2, BookOpen, Utensils, Footprints, Coffee, User } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Leaflet with Webpack/Vite
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (type: string, color: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      backgroundColor: color,
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      color: 'white'
    }}>
      {type === 'class' && <BookOpen size={16} />}
      {type === 'meal' && <Utensils size={16} />}
      {type === 'transit' && <Footprints size={16} />}
      {type === 'break' && <Coffee size={16} />}
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const userIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div style={{
      backgroundColor: '#FF6A00',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      color: 'white'
    }}>
      <User size={16} />
    </div>
  ),
  className: 'user-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface FlowMapProps {
  items: ItineraryItem[];
  userLat?: number;
  userLng?: number;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function FlowMap({ items, userLat, userLng }: FlowMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    userLat && userLng ? [userLat, userLng] : null
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (userLat && userLng) {
      setUserLocation([userLat, userLng]);
    }
  }, [userLat, userLng]);

  if (!items || items.length === 0) return null;

  const positions = (items || [])
    .filter(item => item?.coordinates?.lat !== undefined && item?.coordinates?.lng !== undefined)
    .map(item => [item.coordinates.lat, item.coordinates.lng] as [number, number]);
  
  if (positions.length === 0) return null;
  const center = positions[0];

  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocating(false);
        alert("Could not access your location. Please check permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-[400px] w-full border border-border relative z-0">
      <button
        onClick={handleLocate}
        disabled={locating}
        className="absolute top-4 right-4 z-[1000] bg-white border border-border p-2 shadow-sm hover:bg-bg transition-colors disabled:opacity-50"
        title="Center on my location"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      </button>

      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={userLocation || center} />
        
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-sans text-xs font-bold">YOUR_CURRENT_LOCATION</div>
            </Popup>
          </Marker>
        )}

        {items?.map((item, idx) => {
          const color = 
            item.type === 'class' ? '#1E40AF' : 
            item.type === 'meal' ? '#EA580C' : 
            item.type === 'transit' ? '#3F3F46' : '#059669';
          
          return (
            <Marker 
              key={item.id} 
              position={[item.coordinates.lat, item.coordinates.lng]}
              icon={createCustomIcon(item.type, color)}
            >
              <Popup>
                <div className="font-sans">
                  <div className="font-bold text-sm">{item.time} - {item.activity}</div>
                  <div className="text-xs text-muted">{item.location}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase text-accent">{item.type}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <Polyline 
          positions={positions} 
          color="black" 
          weight={2} 
          dashArray="5, 10"
          opacity={0.6}
        />
      </MapContainer>
    </div>
  );
}

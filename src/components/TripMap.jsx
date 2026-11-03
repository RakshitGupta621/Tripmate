import { MapContainer, Marker, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const pin = L.divIcon({ className: 'trip-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] })
const placePin = (number) => L.divIcon({ className: 'itinerary-pin', html: `<span>${number}</span>`, iconSize: [28, 34], iconAnchor: [14, 30], popupAnchor: [0, -28] })

function FitPlaces({ destination, activityPins }) {
  const map = useMap()
  useEffect(() => {
    if (!destination) return
    if (activityPins.length) {
      const points = [[destination.lat, destination.lon], ...activityPins.map((place) => [place.lat, place.lon])]
      map.fitBounds(points, { padding: [30, 30], maxZoom: 13 })
    } else {
      map.setView([destination.lat, destination.lon], 11)
    }
  }, [map, destination, activityPins])
  return null
}

export default function TripMap({ destination, activityPins = [] }) {
  const center = destination ? [destination.lat, destination.lon] : [20, 0]
  return (
    <div className="map-frame" role="region" aria-label="Interactive destination city map">
      <MapContainer center={center} zoom={destination ? 6 : 2} scrollWheelZoom={false} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="topright" />
        {destination && <Marker position={[destination.lat, destination.lon]} icon={pin}><Tooltip>{destination.name} · destination</Tooltip></Marker>}
        {activityPins.map((place, index) => <Marker key={`${place.day}-${place.time}-${place.title}`} position={[place.lat, place.lon]} icon={placePin(index + 1)}>
          <Tooltip direction="top">Day {place.day} · {place.title}</Tooltip>
          <Popup><b>Day {place.day} · {place.time}</b><br />{place.title}</Popup>
        </Marker>)}
        {destination && <FitPlaces destination={destination} activityPins={activityPins} />}
      </MapContainer>
      <div className="map-legend"><span className="legend-dot" /> City center{activityPins.length > 0 && <><span className="legend-stop">{activityPins.length}</span> Itinerary places</>}</div>
    </div>
  )
}

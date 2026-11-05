import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import type { LatLngExpression, LatLngTuple } from 'leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import appContent from '../../appContent.json'
import { fillText } from '../../utils/util_constants.js'
import type { FitPlacesProps, TripMapProps } from './TripMap.types'

const pin = L.divIcon({
  className: 'trip-pin',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})
const placePin = (number) =>
  L.divIcon({
    className: 'itinerary-pin',
    html: `<span>${number}</span>`,
    iconSize: [28, 34],
    iconAnchor: [14, 30],
    popupAnchor: [0, -28],
  })

function FitPlaces({ destination, activityPins }: FitPlacesProps) {
  const map = useMap()
  useEffect(() => {
    // Leaflet manages its own viewport; update it when the destination pins change.
    if (!destination) return
    if (activityPins.length) {
      const points: LatLngTuple[] = [
        [destination.lat, destination.lon],
        ...activityPins.map((place): LatLngTuple => [place.lat, place.lon]),
      ]
      map.fitBounds(points, { padding: [30, 30], maxZoom: 13 })
    } else {
      map.setView([destination.lat, destination.lon], 11)
    }
  }, [map, destination, activityPins])
  return null
}

export default function TripMap({ destination, activityPins = [], dayRoutes = [] }: TripMapProps) {
  const content = appContent.map
  const center: LatLngExpression = destination ? [destination.lat, destination.lon] : [20, 0]
  return (
    <div className="map-frame" role="region" aria-label={content.regionLabel}>
      <MapContainer
        center={center}
        zoom={destination ? 6 : 2}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution={content.attribution}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        {destination && (
          <Marker
            position={[destination.lat, destination.lon]}
            icon={pin}
            alt={`${destination.name} city center`}
            title={`${destination.name} ${content.cityCenter.toLocaleLowerCase()}`}
          >
            <Tooltip>{`${destination.name} · ${content.destination}`}</Tooltip>
          </Marker>
        )}
        {activityPins.map((place, index) => (
          <Marker
            key={`${place.day}-${place.time}-${place.title}`}
            position={[place.lat, place.lon]}
            icon={placePin(index + 1)}
            alt={`${fillText(content.dayLabel, { day: place.day })}, ${place.title}`}
            title={`${fillText(content.dayLabel, { day: place.day })}, ${place.title}`}
          >
            <Tooltip direction="top">
              {fillText(content.tooltip, {
                day: fillText(content.dayLabel, { day: place.day }),
                title: place.title,
              })}
            </Tooltip>
            <Popup>
              <b>
                {fillText(content.popup, {
                  day: fillText(content.dayLabel, { day: place.day }),
                  time: place.time,
                })}
              </b>
              <br />
              {place.title}
            </Popup>
          </Marker>
        ))}
        {dayRoutes.map(
          (route, index) =>
            route.coordinates?.length > 1 && (
              <Polyline
                key={`route-${index}`}
                positions={route.coordinates}
                pathOptions={{ color: '#7258dc', weight: 4, opacity: 0.8, dashArray: '8 7' }}
              />
            ),
        )}
        {destination && <FitPlaces destination={destination} activityPins={activityPins} />}
      </MapContainer>
      <div className="map-legend">
        <span className="legend-dot" /> {content.cityCenter}
        {activityPins.length > 0 && (
          <>
            <span className="legend-stop">{activityPins.length}</span> {content.itineraryPlaces}
          </>
        )}
      </div>
    </div>
  )
}

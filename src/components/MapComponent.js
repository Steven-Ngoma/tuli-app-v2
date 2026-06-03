import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import io from 'socket.io-client';

const libraries = ['places', 'geometry'];

const MapComponent = ({ onLocationSelect, showRoute, pickupLocation, dropoffLocation, driverLocation, onDriverLocationUpdate, orderId }) => {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  const defaultCenter = { lat: -15.3875, lng: 28.3228 }; // Lusaka center

  useEffect(() => {
    // Connect to Socket.IO
    socketRef.current = io('http://localhost:3001');

    if (orderId) {
      socketRef.current.emit('join', `order-${orderId}`);

      socketRef.current.on('driver-location', (location) => {
        setLiveDriverLocation(location);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (showRoute && pickupLocation && dropoffLocation) {
      calculateRoute();
    }
  }, [showRoute, pickupLocation, dropoffLocation]);

  useEffect(() => {
    if (onDriverLocationUpdate && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          onDriverLocationUpdate(location);

          // Send location update to server
          if (socketRef.current) {
            socketRef.current.emit('location-update', {
              driverId: 'current-driver-id', // Replace with actual driver ID
              location,
              orderId,
            });
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [onDriverLocationUpdate, orderId]);

  const calculateRoute = () => {
    if (!window.google || !pickupLocation || !dropoffLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickupLocation,
        destination: dropoffLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: 'bestguess',
        },
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  const onMapClick = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setSelectedLocation(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        if (map) {
          map.panTo(location);
        }
      }
    }
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <div style={{ height: '100vh', width: '100%' }}>
        <Autocomplete
          onLoad={setAutocomplete}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for landmarks in Lusaka (e.g., Manda Hill, Woodlands)"
            style={{
              boxSizing: 'border-box',
              border: '1px solid transparent',
              width: '240px',
              height: '32px',
              padding: '0 12px',
              borderRadius: '3px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              outline: 'none',
              textOverflow: 'ellipses',
              position: 'absolute',
              left: '50%',
              marginLeft: '-120px',
              top: '10px',
              zIndex: 1,
            }}
          />
        </Autocomplete>

        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={defaultCenter}
          zoom={12}
          onLoad={setMap}
          onClick={onMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#4285F4" stroke="white" stroke-width="3"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">📍</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}

          {pickupLocation && (
            <Marker
              position={pickupLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#34A853" stroke="white" stroke-width="3"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="14">🏪</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              label={{ text: 'Pickup', color: 'white', fontSize: '12px' }}
            />
          )}

          {dropoffLocation && (
            <Marker
              position={dropoffLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#EA4335" stroke="white" stroke-width="3"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="14">🏠</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              label={{ text: 'Dropoff', color: 'white', fontSize: '12px' }}
            />
          )}

          {(driverLocation || liveDriverLocation) && (
            <Marker
              position={liveDriverLocation || driverLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#FBBC05" stroke="white" stroke-width="3"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="14">🚗</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              label={{ text: 'Driver', color: 'black', fontSize: '12px' }}
            />
          )}

          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default MapComponent;
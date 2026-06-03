import React, { useState } from 'react';
import MapComponent from '../components/MapComponent';

const OrderPage = () => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [step, setStep] = useState('pickup'); // 'pickup' or 'dropoff'

  const handleLocationSelect = (location) => {
    if (step === 'pickup') {
      setPickupLocation(location);
      setStep('dropoff');
    } else {
      setDropoffLocation(location);
    }
  };

  const handleOrder = () => {
    // Submit order to backend
    console.log('Ordering:', { pickupLocation, dropoffLocation });
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <MapComponent
        onLocationSelect={handleLocationSelect}
        showRoute={!!(pickupLocation && dropoffLocation)}
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
      />

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        background: 'white',
        padding: 20,
        borderRadius: 10,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <h3>{step === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location'}</h3>
        <p>Tap on the map or search for landmarks in Lusaka</p>

        {pickupLocation && (
          <p>Pickup: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}</p>
        )}
        {dropoffLocation && (
          <p>Dropoff: {dropoffLocation.lat.toFixed(4)}, {dropoffLocation.lng.toFixed(4)}</p>
        )}

        {pickupLocation && dropoffLocation && (
          <button
            onClick={handleOrder}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Place Order
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
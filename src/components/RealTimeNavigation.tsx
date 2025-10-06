import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, MapPin, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

const RealTimeNavigation = () => {
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  const startNavigation = useCallback(() => {
    if (!destination || !currentLocation) {
      toast({
        title: "Missing Information",
        description: "Please enter a destination and enable location",
        variant: "destructive"
      });
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setIsNavigating(true);
          
          // Start watching position for real-time updates
          const id = navigator.geolocation.watchPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setCurrentLocation(newLocation);
              
              // Recalculate route with new position
              directionsService.route(
                {
                  origin: newLocation,
                  destination: destination,
                  travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                  }
                }
              );
            },
            (error) => {
              console.error('Error watching position:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
          setWatchId(id);

          toast({
            title: "Navigation Started",
            description: "Follow the route on the map"
          });
        } else {
          toast({
            title: "Navigation Error",
            description: "Unable to calculate route",
            variant: "destructive"
          });
        }
      }
    );
  }, [destination, currentLocation, toast]);

  const stopNavigation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsNavigating(false);
    setDirections(null);
    toast({
      title: "Navigation Stopped",
      description: "Navigation has been ended"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Real-Time Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter destination address"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isNavigating}
          />
          {!isNavigating ? (
            <Button onClick={startNavigation} className="whitespace-nowrap">
              <Target className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={stopNavigation} variant="destructive" className="whitespace-nowrap">
              Stop
            </Button>
          )}
        </div>

        {currentLocation && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Current: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        )}

        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentLocation || defaultCenter}
            zoom={currentLocation ? 15 : 2}
            options={{
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            )}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: {
                    strokeColor: '#4285F4',
                    strokeWeight: 5,
                  },
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {directions && (
          <div className="text-sm space-y-1">
            <div className="font-semibold">Route Information:</div>
            <div>Distance: {directions.routes[0].legs[0].distance?.text}</div>
            <div>Duration: {directions.routes[0].legs[0].duration?.text}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeNavigation;

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Navigation, Clock, History, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { locationService, locationUtils } from "@/lib/backend-services";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
  address: string | null;
}

export function LocationTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  // Load location history
  const loadLocationHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await locationService.getLocationHistory(user.id);
      setLocationHistory(response.locations?.slice(0, 10) || []); // Show last 10 locations
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  }, []);

  useEffect(() => {
    loadLocationHistory();
  }, [loadLocationHistory]);

  // Get current position
  const getCurrentPosition = async () => {
    setLoading(true);
    try {
      const position = await locationUtils.getCurrentPosition();
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      setCurrentLocation(locationData);
      
      // Get address from reverse geocoding (mock for now)
      const address = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
      locationData.address = address;

      toast({
        title: "📍 Location Updated",
        description: `Lat: ${locationData.latitude.toFixed(4)}, Lng: ${locationData.longitude.toFixed(4)}`,
      });

      return locationData;
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message || "Unable to get your location",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Start tracking
  const startTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use location tracking",
          variant: "destructive",
        });
        return;
      }

      // Get initial position
      const initialLocation = await getCurrentPosition();
      if (!initialLocation) return;

      // Update location in backend
      await locationService.updateLocation(
        user.id,
        initialLocation.latitude,
        initialLocation.longitude,
        initialLocation.accuracy
      );

      // Start watching position
      const id = await locationUtils.watchPosition(async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        setCurrentLocation(locationData);

        // Update backend every position change
        try {
          await locationService.updateLocation(
            user.id,
            locationData.latitude,
            locationData.longitude,
            locationData.accuracy
          );
          
          // Check geofences
          const geofenceCheck = await locationService.checkGeofences(
            user.id,
            locationData.latitude,
            locationData.longitude
          );

          // Show geofence alerts
          if (geofenceCheck.alerts && geofenceCheck.alerts.length > 0) {
            geofenceCheck.alerts.forEach((alert: any) => {
              toast({
                title: `📍 Geofence Alert`,
                description: alert.message,
              });
            });
          }
          
          // Reload history
          await loadLocationHistory();
        } catch (error) {
          console.error('Error updating location:', error);
        }
      });

      setWatchId(id);
      setIsTracking(true);

      toast({
        title: "📍 Tracking Started",
        description: "Your location is being shared with emergency contacts",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start tracking",
        variant: "destructive",
      });
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId !== null) {
      locationUtils.stopWatching(watchId);
      setWatchId(null);
    }
    setIsTracking(false);

    toast({
      title: "📍 Tracking Stopped",
      description: "Location sharing disabled",
    });
  };

  // Check nearby services
  const checkNearbyServices = async () => {
    if (!currentLocation) {
      toast({
        title: "No Location",
        description: "Get your current location first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await locationService.getNearbyServices(
        user.id,
        currentLocation.latitude,
        currentLocation.longitude
      );

      toast({
        title: "🏥 Nearby Services",
        description: `Found ${response.services?.length || 0} emergency services nearby`,
      });
    } catch (error) {
      console.error('Error finding services:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Calculate time ago
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Current Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Live Location Tracking
            </div>
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>Real-time GPS tracking and location sharing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location Display */}
          {currentLocation && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                  <p className="font-mono text-sm">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  ±{currentLocation.accuracy.toFixed(0)}m
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {timeAgo(currentLocation.timestamp)}
                </p>
              </div>
            </div>
          )}

          {/* Tracking Status Alert */}
          {isTracking && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Location Sharing Active</AlertTitle>
              <AlertDescription>
                Your location is being tracked and shared with emergency contacts.
                Battery usage may be higher.
              </AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              variant={isTracking ? "destructive" : "gradient"}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Getting Location..." : isTracking ? "Stop Tracking" : "Start Tracking"}
            </Button>
            {!isTracking && (
              <Button
                onClick={getCurrentPosition}
                variant="outline"
                disabled={loading}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>

          {currentLocation && (
            <Button
              onClick={checkNearbyServices}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Find Nearby Emergency Services
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Location History
            </CardTitle>
            <CardDescription>Recent location updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {locationHistory.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      <p className="font-mono text-sm">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                      {location.address && (
                        <p className="text-xs text-muted-foreground">{location.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(location.created_at)}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      ±{location.accuracy?.toFixed(0) || 0}m
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!currentLocation && !isTracking && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How Location Tracking Works</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Click "Start Tracking" to share your location</li>
              <li>• Location updates every few seconds automatically</li>
              <li>• Emergency contacts can see your live location</li>
              <li>• All location data is encrypted and secure</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

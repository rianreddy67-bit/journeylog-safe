import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  alert_type: string;
  is_active: boolean;
}

export function GeofenceManager() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: "",
    radius: 500,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadGeofences();
  }, []);

  const loadGeofences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('geofences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setGeofences(data || []);
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  };

  const createGeofence = async () => {
    if (!newGeofence.name) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the geofence",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { error } = await supabase
        .from('geofences')
        .insert({
          user_id: user.id,
          name: newGeofence.name,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius_meters: newGeofence.radius,
          alert_type: 'both',
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "🗺️ Geofence Created",
        description: `${newGeofence.name} created at current location`,
      });

      setNewGeofence({ name: "", radius: 500 });
      setShowAddForm(false);
      loadGeofences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteGeofence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('geofences')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Geofence Deleted",
        description: "Safe zone removed",
      });

      loadGeofences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Geofences & Safe Zones
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Get alerts when entering or leaving designated areas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
            <Input
              placeholder="Zone name (e.g., Home, Office)"
              value={newGeofence.name}
              onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={100}
                max={5000}
                value={newGeofence.radius}
                onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">meters radius</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={createGeofence} size="sm" variant="gradient">
                Create at Current Location
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Geofence List */}
        {geofences.length > 0 ? (
          <div className="space-y-2">
            {geofences.map((geofence) => (
              <div
                key={geofence.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{geofence.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Radius: {geofence.radius_meters}m
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Active</Badge>
                  <Button
                    onClick={() => deleteGeofence(geofence.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No geofences created yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create zones to get alerts when you enter or leave
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

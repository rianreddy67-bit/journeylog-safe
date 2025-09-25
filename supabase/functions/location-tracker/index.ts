import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, latitude, longitude, accuracy, tripId } = await req.json();
    
    if (!action || !userId) {
      throw new Error('Action and user ID are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'update_location': {
        if (!latitude || !longitude) {
          throw new Error('Latitude and longitude are required for location update');
        }

        // Reverse geocode to get address
        let address = null;
        try {
          const geoResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          // For demo purposes, we'll just store coordinates
          address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        } catch (geoError) {
          console.warn('Geocoding failed:', geoError);
          address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }

        // Insert location update
        const { data: locationData, error: locationError } = await supabase
          .from('location_updates')
          .insert({
            user_id: userId,
            trip_id: tripId || null,
            latitude: latitude,
            longitude: longitude,
            address: address,
            accuracy: accuracy || null
          })
          .select()
          .single();

        if (locationError) {
          throw locationError;
        }

        // Check for emergency situations (example: if accuracy is very poor, might indicate distress)
        const alerts = [];
        if (accuracy && accuracy > 1000) {
          alerts.push({
            type: 'poor_signal',
            message: 'Poor GPS signal detected - location accuracy may be compromised'
          });
        }

        console.log(`Location updated for user ${userId}: ${latitude}, ${longitude}`);

        return new Response(
          JSON.stringify({
            success: true,
            location: locationData,
            alerts: alerts,
            message: 'Location updated successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'get_location_history': {
        const { data: locations, error: historyError } = await supabase
          .from('location_updates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (historyError) {
          throw historyError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            locations: locations,
            count: locations.length
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'get_nearby_services': {
        if (!latitude || !longitude) {
          throw new Error('Latitude and longitude are required for nearby services');
        }

        // Mock nearby services (in a real app, you'd integrate with Google Places API or similar)
        const services = [
          {
            type: 'hospital',
            name: 'Emergency Hospital',
            distance: '2.3 km',
            phone: 'Emergency: 911',
            coordinates: { lat: latitude + 0.01, lng: longitude + 0.01 }
          },
          {
            type: 'police',
            name: 'Local Police Station', 
            distance: '1.8 km',
            phone: 'Emergency: 911',
            coordinates: { lat: latitude - 0.008, lng: longitude + 0.005 }
          },
          {
            type: 'embassy',
            name: 'Embassy/Consulate',
            distance: '5.2 km',
            phone: '+1-xxx-xxx-xxxx',
            coordinates: { lat: latitude + 0.02, lng: longitude - 0.015 }
          }
        ];

        return new Response(
          JSON.stringify({
            success: true,
            services: services,
            userLocation: { latitude, longitude }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'check_safe_zones': {
        if (!latitude || !longitude) {
          throw new Error('Latitude and longitude are required for safe zone check');
        }

        // Mock safe zone check (in a real app, you'd check against government travel advisories)
        const safetyLevel = Math.random() > 0.2 ? 'safe' : 'caution';
        const alerts = [];

        if (safetyLevel === 'caution') {
          alerts.push({
            type: 'travel_advisory',
            level: 'medium',
            message: 'Exercise increased caution in this area. Stay aware of your surroundings.',
            recommendations: [
              'Avoid traveling alone at night',
              'Keep emergency contacts readily available', 
              'Stay in well-populated areas'
            ]
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            safetyLevel: safetyLevel,
            alerts: alerts,
            location: { latitude, longitude }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('Error in location tracker:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
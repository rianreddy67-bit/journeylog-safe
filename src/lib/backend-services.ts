import { supabase } from '@/integrations/supabase/client';

// Base URL for Supabase Edge Functions
const FUNCTIONS_URL = 'https://vkcwehaihuoxsmatctex.functions.supabase.co/functions/v1';

// AI Travel Assistant Service
export const aiTravelAssistant = {
  async chat(message: string, tripId?: string) {
    const { data, error } = await supabase.functions.invoke('ai-travel-assistant', {
      body: { message, tripId }
    });
    
    if (error) throw error;
    return data;
  }
};

// Emergency SOS Service
export const emergencyService = {
  async triggerSOS(alertType: string, description?: string, location?: any, userId?: string) {
    const { data, error } = await supabase.functions.invoke('emergency-sos', {
      body: { alertType, description, location, userId }
    });
    
    if (error) throw error;
    return data;
  }
};

// Weather Service
export const weatherService = {
  async getWeather(location?: string, lat?: number, lon?: number) {
    const { data, error } = await supabase.functions.invoke('weather-service', {
      body: { location, lat, lon }
    });
    
    if (error) throw error;
    return data;
  }
};

// File Upload Service
export const fileUploadService = {
  async uploadFile(
    file: File, 
    userId: string, 
    options?: {
      tripId?: string;
      documentType?: string;
      bucket?: string;
    }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    
    if (options?.tripId) formData.append('tripId', options.tripId);
    if (options?.documentType) formData.append('documentType', options.documentType);
    if (options?.bucket) formData.append('bucket', options.bucket);
    
    const { data, error } = await supabase.functions.invoke('file-upload', {
      body: formData
    });
    
    if (error) throw error;
    return data;
  }
};

// Location Tracking Service
export const locationService = {
  async updateLocation(userId: string, latitude: number, longitude: number, accuracy?: number, tripId?: string) {
    const { data, error } = await supabase.functions.invoke('location-tracker', {
      body: { 
        action: 'update_location',
        userId, 
        latitude, 
        longitude, 
        accuracy, 
        tripId 
      }
    });
    
    if (error) throw error;
    return data;
  },

  async getLocationHistory(userId: string) {
    const { data, error } = await supabase.functions.invoke('location-tracker', {
      body: { 
        action: 'get_location_history',
        userId
      }
    });
    
    if (error) throw error;
    return data;
  },

  async getNearbyServices(userId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase.functions.invoke('location-tracker', {
      body: { 
        action: 'get_nearby_services',
        userId,
        latitude,
        longitude
      }
    });
    
    if (error) throw error;
    return data;
  },

  async checkSafeZones(userId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase.functions.invoke('location-tracker', {
      body: { 
        action: 'check_safe_zones',
        userId,
        latitude,
        longitude
      }
    });
    
    if (error) throw error;
    return data;
  }
};

// Email Notifications Service
export const emailService = {
  async sendTripReminder(userId: string, trip: any) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'trip_reminder',
        userId,
        data: { trip }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async sendDocumentExpiryAlert(userId: string, document: any) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'document_expiry',
        userId,
        data: { document }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async sendSafetyCheckin(userId: string, location?: any) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'safety_checkin',
        userId,
        data: { location }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async sendExpenseSummary(userId: string, expenses: any[], trip?: any) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'expense_summary',
        userId,
        data: { expenses, trip }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async sendWeatherAlert(userId: string, weatherAlert: any, location: string) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'weather_alert',
        userId,
        data: { weatherAlert, location }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async sendTripCompletion(userId: string, trip: any, stats?: any) {
    const { data, error } = await supabase.functions.invoke('email-notifications', {
      body: { 
        type: 'trip_completion',
        userId,
        data: { trip, stats }
      }
    });
    
    if (error) throw error;
    return data;
  }
};

// Database Operations Service
export const databaseService = {
  // Trips
  trips: {
    async create(tripData: any) {
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getAll(userId: string) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(tripId: string) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(tripId: string, updates: any) {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(tripId: string) {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      
      if (error) throw error;
    }
  },

  // Expenses
  expenses: {
    async create(expenseData: any) {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByTrip(tripId: string) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async update(expenseId: string, updates: any) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(expenseId: string) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    }
  },

  // Safety Alerts
  safetyAlerts: {
    async create(alertData: any) {
      const { data, error } = await supabase
        .from('safety_alerts')
        .insert(alertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async update(alertId: string, updates: any) {
      const { data, error } = await supabase
        .from('safety_alerts')
        .update(updates)
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async resolve(alertId: string) {
      const { data, error } = await supabase
        .from('safety_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Travel Documents
  documents: {
    async create(documentData: any) {
      const { data, error } = await supabase
        .from('travel_documents')
        .insert(documentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('travel_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByTrip(tripId: string) {
      const { data, error } = await supabase
        .from('travel_documents')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async update(documentId: string, updates: any) {
      const { data, error } = await supabase
        .from('travel_documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(documentId: string) {
      const { error } = await supabase
        .from('travel_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
    }
  }
};

// Real-time Subscriptions Service
export const realtimeService = {
  // Subscribe to trips changes
  subscribeToTrips(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to safety alerts
  subscribeToSafetyAlerts(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('safety-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safety_alerts',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to location updates
  subscribeToLocationUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('location-updates-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_updates',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  }
};

// Location utilities
export const locationUtils = {
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  },

  async watchPosition(callback: (position: GeolocationPosition) => void): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        callback,
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      resolve(watchId);
    });
  },

  stopWatching(watchId: number) {
    navigator.geolocation.clearWatch(watchId);
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
};
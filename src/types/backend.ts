// Backend service types for TourSafe

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  trip_id?: string;
  category: 'accommodation' | 'transport' | 'food' | 'entertainment' | 'shopping' | 'other';
  amount: number;
  currency: string;
  description?: string;
  expense_date: string;
  receipt_url?: string;
  created_at: string;
}

export interface SafetyAlert {
  id: string;
  user_id: string;
  trip_id?: string;
  alert_type: 'emergency' | 'medical' | 'theft' | 'natural_disaster' | 'other';
  title: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'active' | 'resolved' | 'false_alarm';
  emergency_contacts_notified: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface TravelDocument {
  id: string;
  user_id: string;
  trip_id?: string;
  document_type: 'passport' | 'visa' | 'insurance' | 'ticket' | 'hotel_booking' | 'other';
  title: string;
  document_url: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
}

export interface LocationUpdate {
  id: string;
  user_id: string;
  trip_id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  created_at: string;
}

export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    weather_code: number;
    description: string;
    wind_speed: number;
    wind_direction: number;
    time: string;
  };
  hourly_forecast: Array<{
    time: string;
    temperature: number;
    humidity: number;
    precipitation_probability: number;
    weather_code: number;
    description: string;
  }>;
  daily_forecast: Array<{
    date: string;
    max_temperature: number;
    min_temperature: number;
    precipitation: number;
    weather_code: number;
    description: string;
  }>;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  type: 'severe_weather' | 'heavy_rain' | 'extreme_heat' | 'extreme_cold';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  date: string;
}

export interface NearbyService {
  type: 'hospital' | 'police' | 'embassy';
  name: string;
  distance: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface SafetyZoneCheck {
  safetyLevel: 'safe' | 'caution' | 'danger';
  alerts: Array<{
    type: string;
    level: string;
    message: string;
    recommendations?: string[];
  }>;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface AIAssistantResponse {
  message: string;
  tripContext: boolean;
}

export interface FileUploadResponse {
  success: boolean;
  file: {
    originalName: string;
    size: number;
    type: string;
    uploadedAt: string;
    path: string;
    bucket: string;
    publicUrl: string;
  };
  document?: TravelDocument;
  message: string;
}

export interface EmergencySOSResponse {
  success: boolean;
  alertId: string;
  contactsNotified: number;
  message: string;
}

export interface LocationServiceResponse {
  success: boolean;
  location?: LocationUpdate;
  locations?: LocationUpdate[];
  services?: NearbyService[];
  safetyLevel?: string;
  alerts?: any[];
  count?: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface EmailNotificationResponse {
  success: boolean;
  emailId?: string;
  contactsNotified?: number;
  message: string;
}

export interface DatabaseServiceOptions {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  table: string;
  schema: string;
  commit_timestamp: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}
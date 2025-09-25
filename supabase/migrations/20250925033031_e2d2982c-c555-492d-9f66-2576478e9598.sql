-- Create comprehensive backend tables for TourSafe app

-- Trips table for managing travel itineraries
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  budget DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses table for tracking travel costs
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('accommodation', 'transport', 'food', 'entertainment', 'shopping', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safety alerts table for emergency situations
CREATE TABLE public.safety_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emergency', 'medical', 'theft', 'natural_disaster', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  location JSONB, -- {lat, lng, address}
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  emergency_contacts_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Travel documents table for storing important documents
CREATE TABLE public.travel_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'visa', 'insurance', 'ticket', 'hotel_booking', 'other')),
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Location tracking for safety purposes
CREATE TABLE public.location_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  accuracy DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trips
CREATE POLICY "Users can view their own trips" 
ON public.trips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips" 
ON public.trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" 
ON public.trips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" 
ON public.trips FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can view their own expenses" 
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
ON public.expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
ON public.expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for safety alerts
CREATE POLICY "Users can view their own safety alerts" 
ON public.safety_alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own safety alerts" 
ON public.safety_alerts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safety alerts" 
ON public.safety_alerts FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for travel documents
CREATE POLICY "Users can view their own travel documents" 
ON public.travel_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own travel documents" 
ON public.travel_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel documents" 
ON public.travel_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel documents" 
ON public.travel_documents FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for location updates
CREATE POLICY "Users can view their own location updates" 
ON public.location_updates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own location updates" 
ON public.location_updates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('travel-documents', 'travel-documents', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false);

-- Create storage policies for travel documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for receipts
CREATE POLICY "Users can view their own receipts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipts" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_trips_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX idx_travel_documents_user_id ON public.travel_documents(user_id);
CREATE INDEX idx_location_updates_user_id ON public.location_updates(user_id);
CREATE INDEX idx_location_updates_created_at ON public.location_updates(created_at);

-- Enable realtime for important tables
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.safety_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.location_updates REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
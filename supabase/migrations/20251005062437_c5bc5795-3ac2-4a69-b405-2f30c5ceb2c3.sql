-- Create location shares table
CREATE TABLE IF NOT EXISTS public.location_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geofences table
CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 500,
  alert_type TEXT NOT NULL DEFAULT 'both',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_shares
CREATE POLICY "Users can view their own location shares"
  ON public.location_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own location shares"
  ON public.location_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location shares"
  ON public.location_shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location shares"
  ON public.location_shares FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for geofences
CREATE POLICY "Users can view their own geofences"
  ON public.geofences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own geofences"
  ON public.geofences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own geofences"
  ON public.geofences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own geofences"
  ON public.geofences FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_shares_user_id ON public.location_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_active ON public.location_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON public.geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON public.geofences(is_active);

-- Add triggers for updated_at
CREATE TRIGGER update_location_shares_updated_at
  BEFORE UPDATE ON public.location_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
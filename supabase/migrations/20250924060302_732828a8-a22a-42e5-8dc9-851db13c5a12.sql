-- Fix search path security issue for generate_digital_id function
CREATE OR REPLACE FUNCTION public.generate_digital_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TS' || upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
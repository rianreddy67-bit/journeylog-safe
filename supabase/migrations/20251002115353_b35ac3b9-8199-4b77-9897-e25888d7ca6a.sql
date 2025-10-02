-- Create insurance policies table
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_number TEXT NOT NULL,
  policy_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, policy_number)
);

-- Create insurance claims table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  claim_id TEXT NOT NULL UNIQUE,
  policy_number TEXT NOT NULL,
  claim_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  trip_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT NOT NULL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data backups table
CREATE TABLE IF NOT EXISTS public.data_backups (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_type TEXT NOT NULL,
  backup_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  backup_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_policies
CREATE POLICY "Users can view their own insurance policies"
  ON public.insurance_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insurance policies"
  ON public.insurance_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance policies"
  ON public.insurance_policies FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for insurance_claims
CREATE POLICY "Users can view their own insurance claims"
  ON public.insurance_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insurance claims"
  ON public.insurance_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance claims"
  ON public.insurance_claims FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (true);

CREATE POLICY "Users can create chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their chat rooms"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can create messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for data_backups
CREATE POLICY "Users can view their own backups"
  ON public.data_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
  ON public.data_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON public.data_backups FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_user_id ON public.insurance_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_id ON public.insurance_claims(claim_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_data_backups_user_id ON public.data_backups(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, policyNumber, claimData, incidentDetails } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'verify_policy') {
      if (!policyNumber) {
        throw new Error('Policy number is required');
      }

      // Mock insurance verification (would connect to real insurance APIs)
      const mockPolicy = {
        policyNumber,
        status: 'active',
        coverage: {
          medical: { limit: 100000, currency: 'USD' },
          emergency_evacuation: { limit: 1000000, currency: 'USD' },
          trip_cancellation: { limit: 5000, currency: 'USD' },
          baggage: { limit: 2500, currency: 'USD' }
        },
        validUntil: '2024-12-31',
        insurer: 'Global Travel Insurance Co.',
        emergencyContact: '+1-800-EMERGENCY',
        claimContact: '+1-800-CLAIMS'
      };

      // Store policy info in database
      const { data, error } = await supabase
        .from('insurance_policies')
        .upsert({
          user_id: userId,
          policy_number: policyNumber,
          policy_data: mockPolicy,
          status: 'verified',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Verified insurance policy: ${policyNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          policy: mockPolicy,
          verificationDate: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'file_claim') {
      if (!claimData) {
        throw new Error('Claim data is required');
      }

      const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Create claim record
      const claim = {
        claimId,
        userId,
        policyNumber,
        incidentType: claimData.incidentType,
        incidentDate: claimData.incidentDate,
        location: claimData.location,
        description: claimData.description,
        estimatedAmount: claimData.estimatedAmount,
        currency: claimData.currency || 'USD',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        supportingDocuments: claimData.documents || []
      };

      // Save to database
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({
          claim_id: claimId,
          user_id: userId,
          policy_number: policyNumber,
          claim_data: claim,
          status: 'submitted'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke('email-notifications', {
        body: {
          type: 'insurance_claim_submitted',
          userId,
          data: { claim }
        }
      });

      console.log(`Filed insurance claim: ${claimId}`);

      return new Response(
        JSON.stringify({
          success: true,
          claimId,
          claim,
          nextSteps: [
            'Claim submitted successfully',
            'You will receive a confirmation email shortly',
            'Claims typically process within 5-10 business days',
            'Keep all receipts and documentation'
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'check_claim_status') {
      const claimId = claimData?.claimId;
      if (!claimId) {
        throw new Error('Claim ID is required');
      }

      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('claim_id', claimId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Mock status updates
      const statusHistory = [
        { date: data.created_at, status: 'submitted', note: 'Claim received and under review' },
        { date: new Date().toISOString(), status: 'processing', note: 'Documentation being verified' }
      ];

      return new Response(
        JSON.stringify({
          claim: data.claim_data,
          currentStatus: 'processing',
          statusHistory,
          estimatedResolution: '3-5 business days'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'get_emergency_contacts') {
      // Get policy info
      const { data, error } = await supabase
        .from('insurance_policies')
        .select('policy_data')
        .eq('user_id', userId)
        .eq('status', 'verified')
        .single();

      if (error) throw error;

      const emergencyContacts = {
        medical: data.policy_data.emergencyContact,
        claims: data.policy_data.claimContact,
        assistance: '+1-800-ASSIST',
        evacuation: '+1-800-EVACUATE'
      };

      return new Response(
        JSON.stringify({
          emergencyContacts,
          policy: data.policy_data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in insurance integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alertType, description, location, userId } = await req.json();
    
    if (!alertType || !userId) {
      throw new Error('Alert type and user ID are required');
    }

    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get user profile and emergency contacts
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Create safety alert in database
    const { data: alert, error: alertError } = await supabase
      .from('safety_alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        title: `${alertType.replace('_', ' ').toUpperCase()} Alert`,
        description: description || `Emergency alert triggered by ${profile.first_name} ${profile.last_name}`,
        location: location || null,
        status: 'active',
        emergency_contacts_notified: false
      })
      .select()
      .single();

    if (alertError) {
      throw alertError;
    }

    // Send notifications to emergency contacts
    const emergencyContacts = profile.emergency_contacts || [];
    const notificationPromises = emergencyContacts.map(async (contact: any) => {
      if (contact.email) {
        try {
          await resend.emails.send({
            from: 'TourSafe Emergency <emergency@toursafe.app>',
            to: [contact.email],
            subject: `🚨 EMERGENCY ALERT - ${profile.first_name} ${profile.last_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
                </div>
                
                <div style="padding: 20px; background: #f9fafb;">
                  <h2>Emergency Alert for ${profile.first_name} ${profile.last_name}</h2>
                  
                  <div style="background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
                    <p><strong>Alert Type:</strong> ${alertType.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                    ${location ? `<p><strong>Location:</strong> ${JSON.stringify(location)}</p>` : ''}
                  </div>
                  
                  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px;">
                    <p><strong>Contact Information:</strong></p>
                    <p>Email: ${profile.email || 'Not provided'}</p>
                    <p>Phone: ${profile.phone || 'Not provided'}</p>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px;">
                    <p><strong>What to do:</strong></p>
                    <ol>
                      <li>Try to contact ${profile.first_name} immediately</li>
                      <li>If you cannot reach them, contact local authorities</li>
                      <li>Keep this email for reference</li>
                    </ol>
                  </div>
                  
                  <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    This alert was sent automatically by TourSafe. If this is a false alarm, please contact ${profile.first_name} to confirm their safety.
                  </p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${contact.email}:`, emailError);
        }
      }
    });

    // Wait for all notifications to be sent
    await Promise.allSettled(notificationPromises);

    // Update alert to mark contacts as notified
    await supabase
      .from('safety_alerts')
      .update({ emergency_contacts_notified: true })
      .eq('id', alert.id);

    console.log(`Emergency alert ${alert.id} created and notifications sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertId: alert.id,
        contactsNotified: emergencyContacts.length,
        message: 'Emergency alert created and contacts notified'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in emergency SOS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
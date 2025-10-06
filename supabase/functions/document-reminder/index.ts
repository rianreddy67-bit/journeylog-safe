import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    if (action === 'check_expiring') {
      // Check for documents expiring within 90 days
      const now = new Date();
      const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const { data: documents, error: docError } = await supabase
        .from('travel_documents')
        .select('*, profiles!inner(user_id)')
        .lt('expiry_date', ninetyDaysLater.toISOString())
        .gt('expiry_date', now.toISOString())
        .eq('profiles.user_id', userId || null);

      if (docError) throw docError;

      // Get user email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) throw userError;

      if (documents && documents.length > 0 && user?.email) {
        const documentList = documents.map(doc => {
          const daysUntilExpiry = Math.floor(
            (new Date(doc.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return `- ${doc.title} (${doc.document_type}): Expires in ${daysUntilExpiry} days`;
        }).join('\n');

        await resend.emails.send({
          from: 'TourSafe <onboarding@resend.dev>',
          to: [user.email],
          subject: '⚠️ Travel Documents Expiring Soon',
          html: `
            <h1>Document Expiry Reminder</h1>
            <p>The following travel documents are expiring within the next 90 days:</p>
            <pre>${documentList}</pre>
            <p>Please renew these documents to avoid travel complications.</p>
            <p>Best regards,<br>The TourSafe Team</p>
          `,
        });

        console.log(`Sent expiry reminder to ${user.email} for ${documents.length} documents`);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          documentsFound: documents?.length || 0,
          emailSent: documents && documents.length > 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'send_trip_reminder') {
      // Send reminder for upcoming trips (within 7 days)
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: trips, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', now.toISOString())
        .lt('start_date', sevenDaysLater.toISOString())
        .eq('status', 'planned');

      if (tripError) throw tripError;

      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) throw userError;

      if (trips && trips.length > 0 && user?.email) {
        for (const trip of trips) {
          const daysUntilTrip = Math.floor(
            (new Date(trip.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await resend.emails.send({
            from: 'TourSafe <onboarding@resend.dev>',
            to: [user.email],
            subject: `🌍 Upcoming Trip: ${trip.title}`,
            html: `
              <h1>Your trip to ${trip.destination} is coming up!</h1>
              <p>Your trip "${trip.title}" starts in ${daysUntilTrip} days.</p>
              <p><strong>Trip Details:</strong></p>
              <ul>
                <li>Destination: ${trip.destination}</li>
                <li>Start Date: ${new Date(trip.start_date).toLocaleDateString()}</li>
                <li>End Date: ${new Date(trip.end_date).toLocaleDateString()}</li>
                ${trip.budget ? `<li>Budget: ${trip.budget}</li>` : ''}
              </ul>
              <p>Don't forget to:</p>
              <ul>
                <li>Check your travel documents</li>
                <li>Review your itinerary</li>
                <li>Pack essential items</li>
                <li>Inform your emergency contacts</li>
              </ul>
              <p>Safe travels!<br>The TourSafe Team</p>
            `,
          });

          console.log(`Sent trip reminder to ${user.email} for trip: ${trip.title}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          tripsFound: trips?.length || 0,
          emailsSent: trips?.length || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action specified');

  } catch (error: any) {
    console.error('Error in document-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

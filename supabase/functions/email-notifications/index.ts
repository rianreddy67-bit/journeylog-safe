import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';
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
    const { type, userId, data } = await req.json();
    
    if (!type || !userId) {
      throw new Error('Email type and user ID are required');
    }

    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    let emailContent = { subject: '', html: '', to: profile.email };

    switch (type) {
      case 'trip_reminder': {
        const { trip } = data;
        emailContent.subject = `🧳 Trip Reminder: ${trip.title}`;
        emailContent.html = generateTripReminderEmail(profile, trip);
        break;
      }

      case 'document_expiry': {
        const { document } = data;
        emailContent.subject = `⚠️ Document Expiry Alert: ${document.title}`;
        emailContent.html = generateDocumentExpiryEmail(profile, document);
        break;
      }

      case 'safety_checkin': {
        const { location } = data;
        emailContent.subject = `✅ Safety Check-in from ${profile.first_name}`;
        emailContent.html = generateSafetyCheckinEmail(profile, location);
        
        // Send to emergency contacts
        const emergencyContacts = profile.emergency_contacts || [];
        const contactEmails = emergencyContacts.map((contact: any) => contact.email).filter(Boolean);
        
        if (contactEmails.length > 0) {
          await Promise.all(contactEmails.map((email: string) => 
            resend.emails.send({
              from: 'TourSafe Safety <safety@toursafe.app>',
              to: [email],
              subject: emailContent.subject,
              html: emailContent.html
            })
          ));
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Safety check-in sent to emergency contacts',
            contactsNotified: contactEmails.length
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'expense_summary': {
        const { expenses, trip } = data;
        emailContent.subject = `💰 Expense Summary: ${trip?.title || 'Your Travels'}`;
        emailContent.html = generateExpenseSummaryEmail(profile, expenses, trip);
        break;
      }

      case 'weather_alert': {
        const { weatherAlert, location } = data;
        emailContent.subject = `🌦️ Weather Alert for ${location}`;
        emailContent.html = generateWeatherAlertEmail(profile, weatherAlert, location);
        break;
      }

      case 'trip_completion': {
        const { trip, stats } = data;
        emailContent.subject = `🎉 Trip Completed: ${trip.title}`;
        emailContent.html = generateTripCompletionEmail(profile, trip, stats);
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send email
    const emailResult = await resend.emails.send({
      from: 'TourSafe <notifications@toursafe.app>',
      to: [emailContent.to],
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log(`Email sent successfully: ${type} to ${emailContent.to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.data?.id,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in email notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Email template functions
function generateTripReminderEmail(profile: any, trip: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🧳 Trip Reminder</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>Hi ${profile.first_name}!</h2>
        <p>Your upcoming trip to <strong>${trip.destination}</strong> is approaching!</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">${trip.title}</h3>
          <p><strong>Destination:</strong> ${trip.destination}</p>
          <p><strong>Start Date:</strong> ${new Date(trip.start_date).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(trip.end_date).toLocaleDateString()}</p>
          ${trip.budget ? `<p><strong>Budget:</strong> $${trip.budget}</p>` : ''}
        </div>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px;">
          <h4>Pre-trip checklist:</h4>
          <ul>
            <li>✓ Check passport and visa requirements</li>
            <li>✓ Review travel insurance</li>
            <li>✓ Update emergency contacts in TourSafe</li>
            <li>✓ Check weather forecast</li>
            <li>✓ Inform your bank about travel plans</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">Safe travels!</p>
        <p>The TourSafe Team</p>
      </div>
    </div>
  `;
}

function generateDocumentExpiryEmail(profile: any, document: any) {
  const expiryDate = new Date(document.expiry_date);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ Document Expiry Alert</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>Hi ${profile.first_name}!</h2>
        <p>Your travel document is expiring soon:</p>
        
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0;">
          <h3 style="margin-top: 0;">${document.title}</h3>
          <p><strong>Document Type:</strong> ${document.document_type}</p>
          <p><strong>Expires:</strong> ${expiryDate.toLocaleDateString()}</p>
          <p><strong>Days Remaining:</strong> ${daysUntilExpiry}</p>
        </div>
        
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px;">
          <h4>Action Required:</h4>
          <p>Please renew this document before it expires to avoid travel disruptions.</p>
          <ul>
            <li>Contact the relevant authorities for renewal</li>
            <li>Allow sufficient time for processing</li>
            <li>Update your TourSafe profile with the new document</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">Stay prepared!</p>
        <p>The TourSafe Team</p>
      </div>
    </div>
  `;
}

function generateSafetyCheckinEmail(profile: any, location: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">✅ Safety Check-in</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>${profile.first_name} ${profile.last_name} has checked in safely</h2>
        
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
          <p><strong>Check-in Time:</strong> ${new Date().toLocaleString()}</p>
          ${location ? `<p><strong>Location:</strong> ${location.address || `${location.lat}, ${location.lng}`}</p>` : ''}
          <p><strong>Status:</strong> Safe and well</p>
        </div>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
          <h4>Contact Information:</h4>
          <p>Email: ${profile.email}</p>
          ${profile.phone ? `<p>Phone: ${profile.phone}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated safety check-in from TourSafe. If you have concerns, please contact ${profile.first_name} directly.
        </p>
      </div>
    </div>
  `;
}

function generateExpenseSummaryEmail(profile: any, expenses: any[], trip: any) {
  const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const categories = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {});

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">💰 Expense Summary</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>Hi ${profile.first_name}!</h2>
        <p>Here's your expense summary${trip ? ` for ${trip.title}` : ''}:</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Total Spent: $${total.toFixed(2)}</h3>
          ${trip && trip.budget ? `<p>Budget: $${trip.budget} (${((total / trip.budget) * 100).toFixed(1)}% used)</p>` : ''}
        </div>
        
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
          <h4>Breakdown by Category:</h4>
          ${Object.entries(categories).map(([category, amount]) => 
            `<p><strong>${category}:</strong> $${(amount as number).toFixed(2)}</p>`
          ).join('')}
        </div>
        
        <p style="margin-top: 20px;">Keep tracking your expenses for better budget management!</p>
        <p>The TourSafe Team</p>
      </div>
    </div>
  `;
}

function generateWeatherAlertEmail(profile: any, alert: any, location: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🌦️ Weather Alert</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>Weather Alert for ${location}</h2>
        
        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
          <h3 style="margin-top: 0;">${alert.title}</h3>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p>${alert.description}</p>
        </div>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
          <h4>Safety Recommendations:</h4>
          <ul>
            <li>Monitor local weather updates</li>
            <li>Avoid unnecessary outdoor activities</li>
            <li>Keep emergency contacts handy</li>
            <li>Follow local authority guidance</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">Stay safe!</p>
        <p>The TourSafe Team</p>
      </div>
    </div>
  `;
}

function generateTripCompletionEmail(profile: any, trip: any, stats: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🎉 Trip Completed!</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2>Welcome back, ${profile.first_name}!</h2>
        <p>You've successfully completed your trip to <strong>${trip.destination}</strong>!</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Trip Statistics:</h3>
          <p><strong>Duration:</strong> ${Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} days</p>
          ${stats.totalExpenses ? `<p><strong>Total Expenses:</strong> $${stats.totalExpenses}</p>` : ''}
          ${stats.locationsVisited ? `<p><strong>Locations Visited:</strong> ${stats.locationsVisited}</p>` : ''}
          ${stats.safetyCheckins ? `<p><strong>Safety Check-ins:</strong> ${stats.safetyCheckins}</p>` : ''}
        </div>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px;">
          <h4>We hope you had an amazing trip! 🌟</h4>
          <p>Thank you for using TourSafe to stay safe during your travels.</p>
          <p>Ready for your next adventure? Start planning in your TourSafe dashboard!</p>
        </div>
        
        <p style="margin-top: 20px;">Safe travels always!</p>
        <p>The TourSafe Team</p>
      </div>
    </div>
  `;
}
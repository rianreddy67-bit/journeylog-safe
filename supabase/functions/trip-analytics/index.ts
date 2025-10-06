import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, tripId, action } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result;

    switch (action) {
      case 'expense_summary': {
        // Get expense analytics
        const { data: expenses, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .eq('trip_id', tripId || null);

        if (expenseError) throw expenseError;

        const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        const byCategory = expenses?.reduce((acc: any, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
          return acc;
        }, {});

        const byCurrency = expenses?.reduce((acc: any, exp) => {
          acc[exp.currency] = (acc[exp.currency] || 0) + Number(exp.amount);
          return acc;
        }, {});

        result = {
          totalExpenses: expenses?.length || 0,
          totalSpent,
          byCategory,
          byCurrency,
          averageExpense: expenses?.length ? totalSpent / expenses.length : 0,
        };
        break;
      }

      case 'trip_statistics': {
        // Get trip statistics
        const { data: trips, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', userId);

        if (tripError) throw tripError;

        const tripStats = {
          totalTrips: trips?.length || 0,
          planned: trips?.filter(t => t.status === 'planned').length || 0,
          active: trips?.filter(t => t.status === 'active').length || 0,
          completed: trips?.filter(t => t.status === 'completed').length || 0,
          cancelled: trips?.filter(t => t.status === 'cancelled').length || 0,
          totalBudget: trips?.reduce((sum, t) => sum + (Number(t.budget) || 0), 0) || 0,
        };

        result = tripStats;
        break;
      }

      case 'safety_overview': {
        // Get safety alerts overview
        const { data: alerts, error: alertError } = await supabase
          .from('safety_alerts')
          .select('*')
          .eq('user_id', userId);

        if (alertError) throw alertError;

        const safetyStats = {
          totalAlerts: alerts?.length || 0,
          active: alerts?.filter(a => a.status === 'active').length || 0,
          resolved: alerts?.filter(a => a.status === 'resolved').length || 0,
          byType: alerts?.reduce((acc: any, alert) => {
            acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
            return acc;
          }, {}),
        };

        result = safetyStats;
        break;
      }

      case 'document_status': {
        // Get document status
        const { data: documents, error: docError } = await supabase
          .from('travel_documents')
          .select('*')
          .eq('user_id', userId);

        if (docError) throw docError;

        const now = new Date();
        const expiringSoon = documents?.filter(doc => {
          if (!doc.expiry_date) return false;
          const expiryDate = new Date(doc.expiry_date);
          const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry > 0 && daysUntilExpiry <= 90; // Expiring within 90 days
        });

        const expired = documents?.filter(doc => {
          if (!doc.expiry_date) return false;
          return new Date(doc.expiry_date) < now;
        });

        result = {
          totalDocuments: documents?.length || 0,
          byType: documents?.reduce((acc: any, doc) => {
            acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
            return acc;
          }, {}),
          expiringSoon: expiringSoon?.length || 0,
          expired: expired?.length || 0,
          expiringDocuments: expiringSoon?.map(doc => ({
            title: doc.title,
            type: doc.document_type,
            expiryDate: doc.expiry_date,
          })),
        };
        break;
      }

      case 'location_insights': {
        // Get location tracking insights
        const { data: locations, error: locError } = await supabase
          .from('location_updates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (locError) throw locError;

        result = {
          totalLocations: locations?.length || 0,
          recentUpdates: locations?.slice(0, 5).map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address,
            timestamp: loc.created_at,
          })),
        };
        break;
      }

      default:
        throw new Error('Invalid action specified');
    }

    console.log(`Analytics generated for action: ${action}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        action,
        data: result,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in trip-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

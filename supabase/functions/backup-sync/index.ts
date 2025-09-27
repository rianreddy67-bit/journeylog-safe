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
    const { action, userId, backupData, backupType = 'full' } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'create_backup') {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Collect user data for backup
      const backupData = await collectUserData(supabase, userId, backupType);
      
      // Create backup record
      const backupId = `backup_${userId}_${Date.now()}`;
      const { data, error } = await supabase
        .from('data_backups')
        .insert({
          id: backupId,
          user_id: userId,
          backup_type: backupType,
          backup_data: backupData,
          backup_size: JSON.stringify(backupData).length,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Created backup ${backupId} for user ${userId}`);

      return new Response(
        JSON.stringify({
          success: true,
          backupId,
          backupSize: data.backup_size,
          itemsCounted: {
            trips: backupData.trips?.length || 0,
            expenses: backupData.expenses?.length || 0,
            documents: backupData.documents?.length || 0,
            alerts: backupData.alerts?.length || 0
          },
          createdAt: data.created_at
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'restore_backup') {
      const { backupId } = await req.json();
      if (!backupId) {
        throw new Error('Backup ID is required');
      }

      // Get backup data
      const { data: backup, error: backupError } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (backupError) throw backupError;

      // Restore data
      const restoredItems = await restoreUserData(supabase, userId, backup.backup_data);

      console.log(`Restored backup ${backupId} for user ${userId}`);

      return new Response(
        JSON.stringify({
          success: true,
          backupId,
          restoredItems,
          restoredAt: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'list_backups') {
      const { data, error } = await supabase
        .from('data_backups')
        .select('id, backup_type, backup_size, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          backups: data,
          totalBackups: data.length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'delete_backup') {
      const { backupId } = await req.json();
      if (!backupId) {
        throw new Error('Backup ID is required');
      }

      const { error } = await supabase
        .from('data_backups')
        .delete()
        .eq('id', backupId)
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          backupId,
          deletedAt: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else if (action === 'sync_status') {
      // Check last backup and sync status
      const { data: lastBackup, error } = await supabase
        .from('data_backups')
        .select('created_at, backup_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const syncStatus = {
        hasBackup: !error && lastBackup,
        lastBackupDate: lastBackup?.created_at || null,
        lastBackupType: lastBackup?.backup_type || null,
        daysSinceLastBackup: lastBackup ? 
          Math.floor((Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
          null,
        recommendedAction: getRecommendedAction(lastBackup)
      };

      return new Response(
        JSON.stringify(syncStatus),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in backup sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function collectUserData(supabase: any, userId: string, backupType: string) {
  const backupData: any = {
    userId,
    backupType,
    timestamp: new Date().toISOString()
  };

  // Always include profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  backupData.profile = profile;

  if (backupType === 'full' || backupType === 'trips') {
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId);
    backupData.trips = trips;
  }

  if (backupType === 'full' || backupType === 'expenses') {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);
    backupData.expenses = expenses;
  }

  if (backupType === 'full' || backupType === 'documents') {
    const { data: documents } = await supabase
      .from('travel_documents')
      .select('*')
      .eq('user_id', userId);
    backupData.documents = documents;
  }

  if (backupType === 'full' || backupType === 'safety') {
    const { data: alerts } = await supabase
      .from('safety_alerts')
      .select('*')
      .eq('user_id', userId);
    backupData.alerts = alerts;

    const { data: locations } = await supabase
      .from('location_updates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit location history
    backupData.locationHistory = locations;
  }

  return backupData;
}

async function restoreUserData(supabase: any, userId: string, backupData: any) {
  const restoredItems: any = {
    profile: 0,
    trips: 0,
    expenses: 0,
    documents: 0,
    alerts: 0
  };

  // Restore profile (update existing)
  if (backupData.profile) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        ...backupData.profile,
        updated_at: new Date().toISOString()
      });
    if (!error) restoredItems.profile = 1;
  }

  // Restore trips
  if (backupData.trips) {
    for (const trip of backupData.trips) {
      const { error } = await supabase
        .from('trips')
        .upsert({
          ...trip,
          updated_at: new Date().toISOString()
        });
      if (!error) restoredItems.trips++;
    }
  }

  // Restore expenses
  if (backupData.expenses) {
    for (const expense of backupData.expenses) {
      const { error } = await supabase
        .from('expenses')
        .upsert(expense);
      if (!error) restoredItems.expenses++;
    }
  }

  // Restore documents
  if (backupData.documents) {
    for (const document of backupData.documents) {
      const { error } = await supabase
        .from('travel_documents')
        .upsert(document);
      if (!error) restoredItems.documents++;
    }
  }

  // Restore safety alerts
  if (backupData.alerts) {
    for (const alert of backupData.alerts) {
      const { error } = await supabase
        .from('safety_alerts')
        .upsert(alert);
      if (!error) restoredItems.alerts++;
    }
  }

  return restoredItems;
}

function getRecommendedAction(lastBackup: any) {
  if (!lastBackup) {
    return 'Create your first backup to protect your travel data';
  }

  const daysSince = Math.floor((Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince > 30) {
    return 'Create a new backup - it\'s been over a month';
  } else if (daysSince > 7) {
    return 'Consider creating a new backup';
  } else {
    return 'Your data is recently backed up';
  }
}
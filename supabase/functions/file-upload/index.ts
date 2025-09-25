import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const tripId = formData.get('tripId') as string;
    const documentType = formData.get('documentType') as string;
    const bucket = formData.get('bucket') as string || 'travel-documents';
    
    if (!file || !userId) {
      throw new Error('File and user ID are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate file type and size
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 20MB limit');
    }

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Convert file to array buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    let documentRecord = null;
    
    // If it's a travel document, save to database
    if (documentType && bucket === 'travel-documents') {
      const { data: docData, error: docError } = await supabase
        .from('travel_documents')
        .insert({
          user_id: userId,
          trip_id: tripId || null,
          document_type: documentType,
          title: file.name,
          document_url: urlData.publicUrl,
          notes: `Uploaded on ${new Date().toISOString()}`
        })
        .select()
        .single();

      if (docError) {
        // If database insertion fails, clean up the uploaded file
        await supabase.storage.from(bucket).remove([fileName]);
        throw docError;
      }
      
      documentRecord = docData;
    }

    // Generate file metadata
    const metadata = {
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      path: fileName,
      bucket: bucket,
      publicUrl: urlData.publicUrl
    };

    console.log(`File uploaded successfully: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        file: metadata,
        document: documentRecord,
        message: 'File uploaded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in file upload:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
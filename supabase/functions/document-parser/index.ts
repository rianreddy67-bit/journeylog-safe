import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentUrl, documentType = "passport" } = await req.json();
    
    if (!documentUrl) {
      throw new Error('Document URL is required');
    }

    // Fetch the document
    const documentResponse = await fetch(documentUrl);
    if (!documentResponse.ok) {
      throw new Error('Failed to fetch document');
    }

    const documentBuffer = await documentResponse.arrayBuffer();
    const base64Document = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));

    // Call OCR service (using a hypothetical OCR API)
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('OCR_SPACE_API_KEY') || '',
      },
      body: JSON.stringify({
        base64Image: `data:image/jpeg;base64,${base64Document}`,
        language: 'eng',
        isOverlayRequired: false,
        detectOrientation: true,
        scale: true,
        isTable: false
      })
    });

    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.ParsedResults?.[0]?.ParsedText || '';

    // Parse document based on type
    let parsedData = {};
    
    if (documentType === 'passport') {
      parsedData = parsePassport(extractedText);
    } else if (documentType === 'visa') {
      parsedData = parseVisa(extractedText);
    } else if (documentType === 'id') {
      parsedData = parseID(extractedText);
    } else {
      parsedData = { rawText: extractedText };
    }

    console.log(`Parsed ${documentType} document successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        documentType,
        extractedText,
        parsedData,
        processingDate: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in document parsing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parsePassport(text: string) {
  const passportRegex = /P<([A-Z]{3})([A-Z0-9<]+)<<([A-Z0-9<]+)/;
  const expiryRegex = /(\d{2})(\d{2})(\d{2})/g;
  
  const match = text.match(passportRegex);
  const dates = [...text.matchAll(expiryRegex)];
  
  return {
    country: match?.[1] || '',
    passportNumber: match?.[2]?.replace(/</g, '') || '',
    surname: match?.[3]?.replace(/</g, '') || '',
    expiryDate: dates[1] ? `20${dates[1][3]}-${dates[1][2]}-${dates[1][1]}` : null,
    issueDate: dates[0] ? `20${dates[0][3]}-${dates[0][2]}-${dates[0][1]}` : null
  };
}

function parseVisa(text: string) {
  return {
    visaNumber: extractPattern(text, /VISA\s*:?\s*([A-Z0-9]+)/i)?.[1] || '',
    validFrom: extractPattern(text, /VALID\s*FROM\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || '',
    validUntil: extractPattern(text, /VALID\s*UNTIL\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || '',
    entries: extractPattern(text, /ENTRIES\s*:?\s*([A-Z]+)/i)?.[1] || ''
  };
}

function parseID(text: string) {
  return {
    idNumber: extractPattern(text, /ID\s*:?\s*([A-Z0-9]+)/i)?.[1] || '',
    dateOfBirth: extractPattern(text, /DOB\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || '',
    expiryDate: extractPattern(text, /EXP\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || ''
  };
}

function extractPattern(text: string, regex: RegExp) {
  return text.match(regex);
}
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
    const { text, sourceLang = 'auto', targetLang, context = 'emergency' } = await req.json();
    
    if (!text || !targetLang) {
      throw new Error('Text and target language are required');
    }

    // Use Google Translate API
    const translateResponse = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${Deno.env.get('GOOGLE_TRANSLATE_API_KEY')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          target: targetLang,
          format: 'text'
        })
      }
    );

    if (!translateResponse.ok) {
      throw new Error(`Translation API error: ${translateResponse.status}`);
    }

    const translateData = await translateResponse.json();
    const translatedText = translateData.data.translations[0].translatedText;
    const detectedSourceLang = translateData.data.translations[0].detectedSourceLanguage || sourceLang;

    // Add emergency context phrases if context is emergency
    let emergencyPhrases = {};
    if (context === 'emergency') {
      emergencyPhrases = await getEmergencyPhrases(targetLang);
    }

    console.log(`Translated text from ${detectedSourceLang} to ${targetLang}`);

    return new Response(
      JSON.stringify({
        originalText: text,
        translatedText,
        sourceLang: detectedSourceLang,
        targetLang,
        context,
        emergencyPhrases,
        confidence: 0.95 // Mock confidence score
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in translation service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getEmergencyPhrases(targetLang: string) {
  const emergencyPhrases = {
    'help': 'Help!',
    'emergency': 'Emergency!',
    'call_police': 'Call the police',
    'call_ambulance': 'Call an ambulance',
    'i_need_help': 'I need help',
    'where_is_hospital': 'Where is the nearest hospital?',
    'i_am_lost': 'I am lost',
    'call_embassy': 'Call my embassy'
  };

  // Translate emergency phrases
  const translatedPhrases: any = {};
  
  for (const [key, phrase] of Object.entries(emergencyPhrases)) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${Deno.env.get('GOOGLE_TRANSLATE_API_KEY')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: phrase,
            source: 'en',
            target: targetLang,
            format: 'text'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        translatedPhrases[key] = data.data.translations[0].translatedText;
      } else {
        translatedPhrases[key] = phrase; // Fallback to English
      }
    } catch {
      translatedPhrases[key] = phrase; // Fallback to English
    }
  }

  return translatedPhrases;
}
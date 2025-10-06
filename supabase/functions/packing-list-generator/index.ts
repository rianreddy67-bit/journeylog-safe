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
    const { destination, duration, activities, season, tripType } = await req.json();
    
    if (!destination || !duration) {
      throw new Error('Destination and duration are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Generate a comprehensive packing list for a trip to ${destination}.

Trip Details:
- Destination: ${destination}
- Duration: ${duration} days
- Season: ${season || 'current'}
- Trip Type: ${tripType || 'leisure'}
- Activities: ${activities?.join(', ') || 'general tourism'}

Create a detailed packing list organized by category:
1. Clothing (consider weather and cultural norms)
2. Toiletries and medications
3. Electronics and accessories
4. Travel documents
5. Safety items
6. Activity-specific gear
7. Optional items

For each item, include:
- Priority level (essential/recommended/optional)
- Quantity suggestions
- Specific notes or tips

Consider local climate, cultural requirements, and planned activities.`;

    console.log('Generating packing list for:', destination);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a travel expert who creates practical, comprehensive packing lists tailored to specific destinations and activities.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const packingList = data.choices[0].message.content;

    console.log('Packing list generated successfully');

    return new Response(
      JSON.stringify({ 
        packingList,
        destination,
        duration,
        metadata: {
          season,
          tripType,
          activities,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in packing-list-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

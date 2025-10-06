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
    const { destination, duration, interests, budget, startDate } = await req.json();
    
    if (!destination || !duration) {
      throw new Error('Destination and duration are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination}.
    
Trip Details:
- Duration: ${duration} days
- Start Date: ${startDate || 'Not specified'}
- Budget Level: ${budget || 'moderate'}
- Interests: ${interests?.join(', ') || 'general sightseeing'}

Please provide a day-by-day itinerary with:
1. Morning, afternoon, and evening activities
2. Estimated costs for each activity
3. Transportation recommendations
4. Meal suggestions
5. Time management tips
6. Safety considerations for each location

Format as a structured daily plan with specific times and locations.`;

    console.log('Generating itinerary for:', destination);

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
            content: 'You are an expert travel planner. Create detailed, practical itineraries with specific times, locations, and budget estimates.' 
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
    const itinerary = data.choices[0].message.content;

    console.log('Itinerary generated successfully');

    return new Response(
      JSON.stringify({ 
        itinerary,
        destination,
        duration,
        metadata: {
          budget,
          interests,
          startDate,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in itinerary-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

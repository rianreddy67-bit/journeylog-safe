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
    const { destination, interests, dateRange } = await req.json();
    
    if (!destination) {
      throw new Error('Destination is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Find interesting local events, activities, and attractions in ${destination}.

Search Parameters:
- Location: ${destination}
- Interests: ${interests?.join(', ') || 'all types'}
- Date Range: ${dateRange || 'upcoming'}

Provide:
1. Local festivals and cultural events
2. Popular tourist attractions and activities
3. Hidden gems and local favorites
4. Dining recommendations
5. Entertainment options
6. Outdoor activities
7. Shopping areas and markets

For each suggestion, include:
- Name and type
- Location/area
- Best time to visit
- Estimated cost (if applicable)
- Why it's recommended
- Safety tips if relevant

Focus on authentic local experiences and current popular spots.`;

    console.log('Finding events for:', destination);

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
            content: 'You are a local travel expert with deep knowledge of events, activities, and attractions around the world. Provide current, accurate recommendations.' 
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
    const events = data.choices[0].message.content;

    console.log('Events found successfully');

    return new Response(
      JSON.stringify({ 
        events,
        destination,
        metadata: {
          interests,
          dateRange,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in local-events-finder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

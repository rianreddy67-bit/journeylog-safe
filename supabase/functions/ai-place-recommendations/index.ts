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
    const { destination, interests, tripType, budget } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build dynamic prompt based on user input
    let prompt = `You are a knowledgeable travel expert. Provide personalized place recommendations for ${destination}.`;
    
    if (interests && interests.length > 0) {
      prompt += `\n\nUser interests: ${interests.join(', ')}`;
    }
    
    if (tripType) {
      prompt += `\nTrip type: ${tripType}`;
    }
    
    if (budget) {
      prompt += `\nBudget level: ${budget}`;
    }

    prompt += `\n\nProvide 5-7 specific place recommendations with:
1. Place name and category (museum, restaurant, park, etc.)
2. Brief description (2-3 sentences)
3. Why it matches the user's interests
4. Best time to visit
5. Approximate cost/budget level (free, $, $$, $$$)

Format your response as a structured list that's easy to read.`;

    console.log('Generating place recommendations for:', destination);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful travel assistant providing personalized place recommendations. Be specific, practical, and consider the user's preferences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recommendations = data.choices[0].message.content;

    console.log('Successfully generated recommendations');

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        destination,
        model: "google/gemini-2.5-flash"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in ai-place-recommendations:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to generate recommendations" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

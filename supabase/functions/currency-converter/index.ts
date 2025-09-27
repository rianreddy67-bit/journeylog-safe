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
    const { amount, fromCurrency, toCurrency, action = 'convert' } = await req.json();
    
    if (action === 'convert') {
      if (!amount || !fromCurrency || !toCurrency) {
        throw new Error('Amount, from currency, and to currency are required');
      }

      // Use exchangerate-api.com (free tier)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates[toCurrency.toUpperCase()];
      
      if (!rate) {
        throw new Error(`Currency ${toCurrency} not found`);
      }

      const convertedAmount = amount * rate;
      
      console.log(`Converted ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`);

      return new Response(
        JSON.stringify({
          originalAmount: amount,
          convertedAmount: parseFloat(convertedAmount.toFixed(2)),
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          exchangeRate: rate,
          lastUpdated: data.date,
          calculation: `${amount} ${fromCurrency.toUpperCase()} × ${rate} = ${convertedAmount.toFixed(2)} ${toCurrency.toUpperCase()}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    
    else if (action === 'rates') {
      const baseCurrency = fromCurrency || 'USD';
      
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Get popular travel currencies
      const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'THB'];
      const filteredRates = Object.fromEntries(
        Object.entries(data.rates).filter(([currency]) => 
          popularCurrencies.includes(currency)
        )
      );

      console.log(`Retrieved exchange rates for ${baseCurrency}`);

      return new Response(
        JSON.stringify({
          baseCurrency: baseCurrency.toUpperCase(),
          rates: filteredRates,
          lastUpdated: data.date,
          popularCurrencies
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    else if (action === 'history') {
      // Mock historical data (would use a paid API for real data)
      const mockHistory = generateMockHistory(fromCurrency, toCurrency);
      
      return new Response(
        JSON.stringify({
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          period: '30days',
          history: mockHistory
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    else {
      throw new Error('Invalid action. Use "convert", "rates", or "history"');
    }

  } catch (error: any) {
    console.error('Error in currency converter:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateMockHistory(from: string, to: string) {
  const history = [];
  const baseRate = Math.random() * 2 + 0.5; // Random base rate between 0.5 and 2.5
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some variation to the rate
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const rate = baseRate + variation;
    
    history.push({
      date: date.toISOString().split('T')[0],
      rate: parseFloat(rate.toFixed(6))
    });
  }
  
  return history;
}
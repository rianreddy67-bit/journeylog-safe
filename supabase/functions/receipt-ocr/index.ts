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
    const { imageUrl, userId, tripId } = await req.json();
    
    if (!imageUrl || !userId) {
      throw new Error('Image URL and user ID are required');
    }

    // Fetch the receipt image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch receipt image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Use OCR service to extract text
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('OCR_SPACE_API_KEY') || '',
      },
      body: JSON.stringify({
        base64Image: `data:image/jpeg;base64,${base64Image}`,
        language: 'eng',
        isOverlayRequired: false,
        detectOrientation: true,
        scale: true,
        isTable: true // Better for receipts
      })
    });

    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.ParsedResults?.[0]?.ParsedText || '';

    // Parse receipt data
    const receiptData = parseReceiptText(extractedText);

    // If successful parsing, create expense record
    let expenseRecord = null;
    if (receiptData.amount && receiptData.amount > 0) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          trip_id: tripId,
          amount: receiptData.amount,
          currency: receiptData.currency || 'USD',
          category: receiptData.category || 'other',
          description: receiptData.merchant || 'Receipt scan',
          expense_date: receiptData.date || new Date().toISOString(),
          receipt_url: imageUrl,
          receipt_data: receiptData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error) {
        expenseRecord = data;
      }
    }

    console.log(`Processed receipt OCR for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        receiptData,
        expenseRecord,
        processingDate: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in receipt OCR:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseReceiptText(text: string) {
  console.log('Parsing receipt text:', text);
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let amount = 0;
  let currency = 'USD';
  let merchant = '';
  let date = '';
  let category = 'other';
  let items: any[] = [];

  // Find merchant (usually first few lines)
  const merchantLine = lines.find(line => 
    line.length > 3 && 
    !line.match(/\d+\/\d+\/\d+/) && 
    !line.match(/\$\d+/) &&
    !line.toLowerCase().includes('total') &&
    !line.toLowerCase().includes('tax')
  );
  if (merchantLine) {
    merchant = merchantLine;
  }

  // Find date patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}-\d{1,2}-\d{4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        date = match[1];
        break;
      }
    }
    if (date) break;
  }

  // Find total amount
  const amountPatterns = [
    /total[:\s]*\$?(\d+\.?\d*)/i,
    /amount[:\s]*\$?(\d+\.?\d*)/i,
    /\$(\d+\.\d{2})\s*$/,
    /(\d+\.\d{2})\s*$/ // Last line with decimal amount
  ];

  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        const parsedAmount = parseFloat(match[1]);
        if (parsedAmount > amount) { // Take the largest amount found (likely the total)
          amount = parsedAmount;
        }
      }
    }
  }

  // Detect currency
  if (text.includes('€')) currency = 'EUR';
  else if (text.includes('£')) currency = 'GBP';
  else if (text.includes('¥')) currency = 'JPY';
  else if (text.includes('$')) currency = 'USD';

  // Categorize based on merchant name or items
  const merchantLower = merchant.toLowerCase();
  if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') || merchantLower.includes('bar')) {
    category = 'food';
  } else if (merchantLower.includes('hotel') || merchantLower.includes('motel') || merchantLower.includes('inn')) {
    category = 'accommodation';
  } else if (merchantLower.includes('gas') || merchantLower.includes('fuel') || merchantLower.includes('taxi') || merchantLower.includes('uber')) {
    category = 'transportation';
  } else if (merchantLower.includes('shop') || merchantLower.includes('store') || merchantLower.includes('mall')) {
    category = 'shopping';
  }

  // Extract individual items (simplified)
  for (const line of lines) {
    const itemMatch = line.match(/(.+?)\s+\$?(\d+\.?\d*)/);
    if (itemMatch && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('tax')) {
      const itemPrice = parseFloat(itemMatch[2]);
      if (itemPrice > 0 && itemPrice < amount) {
        items.push({
          name: itemMatch[1].trim(),
          price: itemPrice
        });
      }
    }
  }

  return {
    amount,
    currency,
    merchant,
    date: date || new Date().toISOString().split('T')[0],
    category,
    items,
    confidence: amount > 0 ? 0.8 : 0.3 // Simple confidence scoring
  };
}
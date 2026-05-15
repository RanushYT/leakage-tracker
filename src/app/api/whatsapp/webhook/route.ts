import { NextResponse } from 'next/server';
import { parseExpenseDetails } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Webhook verification (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// Handling incoming messages (POST)
export async function POST(request: Request) {
  const body = await request.json();

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from; // sender's phone number
      const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

      console.log(`Received message from ${from}: ${msgBody}`);

      try {
        // 1. Parse with Gemini
        const expenseData = await parseExpenseDetails(msgBody);
        
        // 2. Save to Supabase
        const { error } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: from,
              item: expenseData.item,
              amount: expenseData.amount,
              currency: expenseData.currency,
              category: expenseData.category,
              necessity_score: expenseData.necessity_score,
              is_unnecessary: expenseData.is_unnecessary,
            }
          ]);

        if (error) {
          console.error('Supabase Error:', error);
          throw new Error('Database error');
        }

        // 3. Send confirmation back to WhatsApp
        const responseMessage = `Logged! ${expenseData.category}: ${expenseData.amount} ${expenseData.currency}.\n${expenseData.is_unnecessary ? '⚠️ Marked as Unnecessary' : '✅ Marked as Need'}`;
        await sendWhatsAppMessage(phoneNumberId, from, responseMessage);

      } catch (error) {
        console.error('Error processing expense:', error);
        await sendWhatsAppMessage(phoneNumberId, from, 'Sorry, I could not process that expense. Please try formatting it like "Pizza for 2500".');
      }
    }
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } else {
    return new NextResponse('Not Found', { status: 404 });
  }
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      text: { body: text },
    }),
  });

  if (!response.ok) {
    console.error('Failed to send WhatsApp message', await response.text());
  }
}

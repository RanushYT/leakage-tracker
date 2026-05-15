import { NextResponse } from 'next/server';
import { roastWallet } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Fetch recent transactions for this user
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ roast: "You haven't bought anything yet. Either you're broke or incredibly disciplined. Either way, boring." });
    }

    const roast = await roastWallet(transactions);
    
    return NextResponse.json({ roast });
  } catch (error) {
    console.error('Roast error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

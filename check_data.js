const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmyhlqbzlansegqlorfz.supabase.co';
const supabaseKey = 'sb_publishable_E1h98-nZWdlt2ZvSeWsA5w_gfOiv96H';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles, pErr);

  const { data: txs, error: tErr } = await supabase.from('transactions').select('*');
  console.log('Transactions:', txs, tErr);
}

checkData();

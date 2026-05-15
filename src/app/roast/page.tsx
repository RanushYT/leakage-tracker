'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

export default function RoastPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roast, setRoast] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [transactionsLength, setTransactionsLength] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profileData) {
        setProfile(profileData);
        if (profileData.whatsapp_number) {
          const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profileData.whatsapp_number);
          setTransactionsLength(count || 0);
        }
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleRoast = async () => {
    if (!profile?.whatsapp_number) return;
    setIsRoasting(true);
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.whatsapp_number })
      });
      const data = await res.json();
      setRoast(data.roast);
    } catch (e) {
      setRoast('Failed to roast. You got lucky this time.');
    }
    setIsRoasting(false);
  };

  if (loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><div className="animate-pulse w-8 h-8 bg-orange-500 rounded-full"></div></div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#030303] text-white p-6 md:p-12 font-sans selection:bg-orange-500/30 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/10 border border-orange-500/20">
            <Flame size={40} className="text-orange-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Roast My Wallet</h1>
          <p className="text-gray-400 text-lg font-light">Let our highly critical AI analyze your recent spending and violently judge your financial choices.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="min-h-[200px] flex flex-col justify-center items-center text-center relative z-10 mb-8">
            {roast ? (
              <p className="text-gray-200 text-xl leading-relaxed font-light italic">"{roast}"</p>
            ) : (
              <p className="text-gray-500 text-lg leading-relaxed font-light">
                Ready to face reality? <br/>
                We will analyze your {transactionsLength} recent transactions.
              </p>
            )}
          </div>
          
          <button 
            onClick={handleRoast}
            disabled={isRoasting || transactionsLength === 0}
            className="w-full relative z-10 bg-white hover:bg-gray-200 text-black font-extrabold py-5 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl text-lg"
          >
            {isRoasting ? (
              <span className="animate-pulse flex items-center gap-2">
                <Flame className="animate-bounce" size={20} /> Analyzing failure...
              </span>
            ) : (
              <>
                <Flame size={20} /> 
                {roast ? "Roast Me Again" : "Generate Roast"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

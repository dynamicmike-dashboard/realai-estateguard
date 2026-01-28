import React, { useState } from 'react';
import { supabase } from './AuthProvider';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { business_name: businessName }
          }
        });
        if (error) throw error;
        alert("Registration successful! Please check your email for verification.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px]"></div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] w-full max-w-md shadow-2xl relative z-10">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gold rounded-2xl mx-auto flex items-center justify-center text-slate-900 text-3xl mb-4 shadow-lg shadow-gold/20">
                    <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h1 className="text-3xl font-luxury font-bold text-white mb-2">EstateGuard AI</h1>
                <p className="text-slate-400 text-sm tracking-wide uppercase font-bold">Secure Agent Portal</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
                {isRegistering && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gold uppercase tracking-widest pl-1">Agency Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
                            placeholder="Prestige Worldwide Realty"
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                        />
                    </div>
                )}
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gold uppercase tracking-widest pl-1">Agent Email</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
                        placeholder="agent@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gold uppercase tracking-widest pl-1">Secure Passkey</label>
                    <input 
                        type="password" 
                        required 
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gold to-yellow-600 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-widest text-sm"
                >
                    {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (isRegistering ? 'Initialize Account' : 'Authenticate')}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                    {isRegistering ? 'Already have credentials?' : 'Need to onboard your agency?'}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-gold font-bold ml-2 hover:underline focus:outline-none"
                    >
                        {isRegistering ? 'Login' : 'Apply for Access'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};

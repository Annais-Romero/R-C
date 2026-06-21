'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // Intentar iniciar sesión en Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrorMsg('Credenciales incorrectas. Inténtalo de nuevo.');
                setLoading(false);
                return;
            }

            if (data?.session) {
                // Forzar un refresco rápido antes de moverte para que el layout de Next.js entienda que hay sesión
                router.refresh();
                // Redirigir al panel de administración
                router.push('/admin');
            }
        } catch (err) {
            setErrorMsg('Ocurrió un error inesperado de conexión.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 antialiased">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">

                {/* Contenedor del Logo y Títulos */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <img 
                        src="/logo-rc.png" 
                        alt="Logo RentCar" 
                        className="h-16 w-auto object-contain drop-shadow-md"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                            Acceso Admin
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            Ingresa tus credenciales para gestionar la flota
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-medium">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 text-sm">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">
                            Correo Electrónico
                        </label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@rc-rentacar.cl"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold py-2.5 rounded-xl transition-colors mt-2 shadow-lg shadow-amber-500/10 active:scale-[0.99] transform"
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
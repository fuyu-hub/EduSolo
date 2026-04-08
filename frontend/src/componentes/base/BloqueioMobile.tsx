import React from 'react';
import { Monitor } from 'lucide-react';

export const MobileBlocker = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="relative bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                    <Monitor className="w-16 h-16 text-primary mx-auto" />
                </div>
            </div>

            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
                Versão Desktop Apenas
            </h1>

            <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-8">
                No momento, o EduSolos está otimizado apenas para computadores.
                <br />
                Por favor, acesse via desktop.
            </p>

            <p className="fixed bottom-8 text-slate-600 text-sm">
                EduSolos © 2026
            </p>
        </div>
    );
};

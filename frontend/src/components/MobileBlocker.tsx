
import React from 'react';
import { Construction, Monitor } from 'lucide-react';


export const MobileBlocker = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl mb-8">
                    <Monitor className="w-16 h-16 text-primary mx-auto mb-4" />
                    <Construction className="w-8 h-8 text-yellow-500 absolute -bottom-2 -right-2 animate-bounce" />
                </div>
            </div>

            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
                Versão Desktop Apenas
            </h1>

            <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-8">
                No momento, o EduSolo está otimizado apenas para computadores.
                Estamos trabalhando duro na versão mobile!
            </p>

            <div className="bg-slate-900/50 rounded-lg p-6 border border-white/5 max-w-sm w-full backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Status do Desenvolvimento
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-400">Desktop</span>
                            <span className="text-emerald-400 font-medium">100%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-400">Mobile</span>
                            <span className="text-amber-400 font-medium">Em breve</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/50 rounded-full w-[15%] animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <p className="fixed bottom-8 text-slate-600 text-sm">
                EduSolos © 2026
            </p>
        </div>
    );
};

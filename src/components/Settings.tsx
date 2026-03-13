import React, { useState } from 'react';
import { Save, Trash2, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const [url, setUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('supabase_key') || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = () => {
    setStatus('saving');
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, 800);
  };

  const handleClear = () => {
    if (confirm('Isso removerá as chaves personalizadas e voltará para o padrão. Continuar?')) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Conexão com Supabase</h3>
            <p className="text-sm text-zinc-500">Configure suas próprias chaves para persistência permanente.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">URL do Projeto</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Anon Key (Chave Pública)</label>
            <textarea 
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm h-32 resize-none"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1Ni..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              onClick={handleSave}
              disabled={status !== 'idle'}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'saving' ? (
                'Salvando...'
              ) : status === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar e Reiniciar</>
              )}
            </button>
            <button 
              onClick={handleClear}
              className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg font-medium hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Limpar Configurações
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">Aviso Importante</p>
          <p>Ao trocar as chaves, você será desconectado e precisará fazer login novamente no novo projeto. Certifique-se de que as tabelas `products` e `movements` existam no novo banco de dados.</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-xl">
        <h4 className="font-semibold mb-4">Estrutura de Tabelas Necessária</h4>
        <p className="text-sm text-zinc-600 mb-4">Execute este SQL no Editor SQL do Supabase para criar as tabelas:</p>
        <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-lg text-[10px] overflow-x-auto">
{`-- Tabela de Produtos
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  price DECIMAL(10,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Movimentações
CREATE TABLE movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT,
  type TEXT CHECK (type IN ('in', 'out')),
  quantity INTEGER,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);`}
        </pre>
      </div>
    </div>
  );
}

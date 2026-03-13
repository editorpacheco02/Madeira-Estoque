import React, { useState, useEffect } from 'react';
import { supabase, isConfigured, isUsingFallback } from '../lib/supabase';
import { LogIn, Mail, Loader2, AlertCircle, Lock, UserPlus, KeyRound, Settings, X, Check, Info } from 'lucide-react';

type LoginMode = 'magic-link' | 'password' | 'signup';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('password');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Manual config states
  const [configUrl, setConfigUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [configKey, setConfigKey] = useState(localStorage.getItem('supabase_key') || '');

  const saveConfig = () => {
    localStorage.setItem('supabase_url', configUrl);
    localStorage.setItem('supabase_key', configKey);
    window.location.reload(); // Reload to re-initialize Supabase client
  };

  const clearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    window.location.reload();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Enviando Magic Link para:', email);
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Enviamos um link de acesso para seu e-mail. Verifique sua caixa de entrada.',
      });
    } catch (error: any) {
      console.error('Erro no Magic Link:', error);
      const isInvalidKey = 
        error.message?.includes('Invalid API key') || 
        error.status === 401 || 
        error.status === 403 ||
        error.code === 'PGRST301';

      if (isInvalidKey) {
        setMessage({ type: 'error', text: 'Erro: Chave de API Inválida ou expirada. Abra as configurações para corrigir.' });
        setShowConfig(true);
      } else {
        setMessage({ type: 'error', text: error.message || 'Erro ao enviar link.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tentando login com senha para:', email);
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('Login bem-sucedido');
    } catch (error: any) {
      console.error('Erro no login:', error);
      const isInvalidKey = 
        error.message?.includes('Invalid API key') || 
        error.status === 401 || 
        error.status === 403 ||
        error.code === 'PGRST301';

      if (isInvalidKey) {
        setMessage({ type: 'error', text: 'Erro: Chave de API Inválida ou expirada. Abra as configurações para corrigir.' });
        setShowConfig(true);
      } else {
        setMessage({ type: 'error', text: 'E-mail ou senha incorretos.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando cadastro para:', email);
    setLoading(true);
    setMessage(null);

    // Timeout de 15 segundos para evitar travamento infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setMessage({ type: 'error', text: 'A requisição demorou muito. Verifique sua conexão ou as chaves do Supabase.' });
      }
    }, 15000);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      clearTimeout(timeoutId);
      console.log('Resposta do Supabase:', { data, error });

      if (error) throw error;

      if (data.user && data.session) {
        setMessage({
          type: 'success',
          text: 'Cadastro realizado com sucesso! Redirecionando...',
        });
      } else if (data.user && !data.session) {
        setMessage({
          type: 'success',
          text: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer login.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Cadastro realizado! Tente entrar com sua senha agora.',
        });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Erro no cadastro:', error);
      
      const isInvalidKey = 
        error.message?.includes('Invalid API key') || 
        error.status === 401 || 
        error.status === 403 ||
        error.code === 'PGRST301'; // Supabase invalid API key code

      if (isInvalidKey) {
        setMessage({ 
          type: 'error', 
          text: 'Erro: Chave de API Inválida ou expirada. O sistema abriu as configurações para você inserir suas próprias chaves do Supabase.' 
        });
        setShowConfig(true);
      } else {
        setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar.' });
      }
    } finally {
      console.log('Finalizando estado de carregamento');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      {!isConfigured && (
        <div className="w-full max-w-md mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">Configuração Inválida</p>
            <p>A URL do Supabase não é válida. Clique no ícone de engrenagem no canto superior para configurar corretamente.</p>
          </div>
        </div>
      )}

      {isConfigured && isUsingFallback && (
        <div className="w-full max-w-md mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-800 shadow-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">Usando Chaves de Demonstração</p>
            <p>O sistema está usando chaves de teste que podem expirar. Configure suas próprias chaves do Supabase clicando na engrenagem.</p>
          </div>
        </div>
      )}

      {/* Botão de Configuração de Emergência */}
      <button 
        onClick={() => setShowConfig(true)}
        className="fixed top-4 right-4 p-2 bg-white border border-zinc-200 rounded-full shadow-sm text-zinc-400 hover:text-emerald-600 transition-colors"
        title="Configurações de API"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Modal de Configuração */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Configuração do Supabase</h2>
              <button onClick={() => setShowConfig(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">URL do Projeto</label>
                <input 
                  type="text" 
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Anon Key (Chave Pública)</label>
                <textarea 
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1Ni..."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={saveConfig}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Salvar e Reiniciar
                </button>
                <button 
                  onClick={clearConfig}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
                >
                  Limpar
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center">
                Encontre estas chaves em: <br />
                <a 
                  href="https://supabase.com/dashboard/project/_/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  Configurações {'>'} API no seu painel Supabase
                </a>
              </p>
              <p className="text-[10px] text-zinc-400 text-center">
                Use esta configuração caso as chaves automáticas não funcionem.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <LogIn className="text-emerald-600 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {mode === 'signup' ? 'Criar Conta' : 'Acessar Sistema'}
          </h1>
          <p className="text-zinc-500 text-center mt-2">
            {mode === 'magic-link' 
              ? 'Enviaremos um link para seu e-mail.' 
              : mode === 'signup' 
                ? 'Informe um e-mail e senha para se cadastrar.'
                : 'Entre com seu e-mail e senha.'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-zinc-100 rounded-lg">
          <button
            onClick={() => { setMode('password'); setMessage(null); }}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              mode === 'password' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Senha
          </button>
          <button
            onClick={() => { setMode('magic-link'); setMessage(null); }}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              mode === 'magic-link' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            E-mail
          </button>
          <button
            onClick={() => { setMode('signup'); setMessage(null); }}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              mode === 'signup' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Cadastrar
          </button>
        </div>

        <form 
          onSubmit={mode === 'magic-link' ? handleMagicLink : mode === 'signup' ? handleSignUp : handlePasswordLogin} 
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'magic-link' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'magic-link' ? (
              <>
                <Mail className="w-5 h-5" />
                Enviar link
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-5 h-5" />
                Criar conta
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {message && (
          <div
            className={clsx(
              "mt-6 p-4 rounded-lg text-sm flex items-start gap-3",
              message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

function clsx(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Preencha todos os campos'); return; }
    setLoading(true); setError('');

    const { error: authError } = await api.signIn(email.trim(), password);
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'E-mail ou senha inválidos'
        : authError.message);
      setLoading(false);
      return;
    }

    nav('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 bg-surface-950">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/30 via-surface-950 to-navy-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-brand-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="eDIAZ Solutions" className="h-12 mx-auto mb-5" />
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">eGuard</h1>
          <p className="text-surface-500 text-sm mt-1">Painel de controle de acesso</p>
        </div>

        <form onSubmit={submit} className="card p-7 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">E-mail</label>
            <input type="email" className="input-field text-sm"
              placeholder="admin@empresa.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Senha</label>
            <input type="password" className="input-field text-sm"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-surface-600 text-xs mt-6">eDIAZ Solutions · eGuard v1.0</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import type { CompanyToken } from '../types';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy}
      className="p-1 rounded hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

interface NewTokenModalProps {
  onClose: () => void;
  onCreated: (token: CompanyToken) => void;
}

function NewTokenModal({ onClose, onCreated }: NewTokenModalProps) {
  const [name, setName] = useState('');
  const [maxDevices, setMaxDevices] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setSaving(true); setError('');
    try {
      const token = await api.createCompanyToken({
        name: name.trim() || undefined,
        maxDevices: maxDevices ? parseInt(maxDevices) : undefined,
      });
      onCreated(token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar token');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="font-semibold text-surface-100">Novo Token de Provisioning</h2>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nome (opcional)</label>
            <input type="text" className="input-field text-sm"
              placeholder="ex: Token GPO, Sala de TI"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Limite de dispositivos (opcional)
            </label>
            <input type="number" className="input-field text-sm" min="1"
              placeholder="Deixe vazio para ilimitado"
              value={maxDevices} onChange={e => setMaxDevices(e.target.value)} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-surface-800">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-all">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Plus className="w-4 h-4" />}
            Criar Token
          </button>
        </div>
      </div>
    </div>
  );
}

interface RawTokenBannerProps {
  token: CompanyToken;
  onDismiss: () => void;
}

function RawTokenBanner({ token, onDismiss }: RawTokenBannerProps) {
  return (
    <div className="card p-5 border border-yellow-500/30 bg-yellow-500/5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-yellow-400 font-semibold text-sm">Token criado — copie agora!</p>
          <p className="text-surface-400 text-xs mt-0.5">
            Este token não será exibido novamente. Use-o no instalador como /COMPANYTOKEN.
          </p>
        </div>
        <button onClick={onDismiss} className="text-surface-500 hover:text-surface-300 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 bg-surface-950 rounded-lg px-4 py-3 border border-surface-700">
        <code className="text-brand-300 text-xs font-mono flex-1 break-all">{token.rawToken}</code>
        <CopyButton text={token.rawToken!} />
      </div>
    </div>
  );
}

export default function CompanyTokensPage() {
  const [tokens, setTokens] = useState<CompanyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newToken, setNewToken] = useState<CompanyToken | null>(null);

  async function load() {
    setLoading(true); setError('');
    try { setTokens(await api.getCompanyTokens()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    if (!confirm('Revogar este token? Dispositivos que ainda não foram registrados não poderão se auto-registrar.')) return;
    try {
      await api.revokeCompanyToken(id);
      setTokens(prev => prev.map(t => t.id === id ? { ...t, active: false } : t));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  function handleCreated(token: CompanyToken) {
    setShowModal(false);
    setNewToken(token);
    setTokens(prev => [token, ...prev]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-3">
            <Key className="w-7 h-7 text-brand-400" />
            Tokens de Acesso
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            Tokens para auto-registro de dispositivos no primeiro boot
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Novo Token
        </button>
      </div>

      {newToken && (
        <RawTokenBanner token={newToken} onDismiss={() => setNewToken(null)} />
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Instrução de uso */}
      <div className="card p-4 bg-navy-950/50 border-navy-800/50 text-sm text-surface-400 space-y-1">
        <p className="font-medium text-surface-300">Como usar</p>
        <p>No instalador, passe o token via linha de comando:</p>
        <code className="text-brand-300 font-mono text-xs block mt-1">
          eguard-setup.exe /VERYSILENT /APIURL=https://... /COMPANYTOKEN=seu-token
        </code>
        <p className="mt-2">O agente se auto-registra no primeiro boot e salva o token permanente.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="card p-12 text-center">
          <Key className="w-12 h-12 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-500">Nenhum token criado ainda.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Nome</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Limite</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Expira</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {tokens.map(t => (
                <tr key={t.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-surface-200 font-medium">
                    {t.name || <span className="text-surface-500 italic">Sem nome</span>}
                  </td>
                  <td className="px-5 py-3.5 text-surface-400">
                    {t.maxDevices ? `${t.maxDevices} dispositivos` : 'Ilimitado'}
                  </td>
                  <td className="px-5 py-3.5 text-surface-400 text-xs">
                    {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      t.active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-surface-800 text-surface-500 border border-surface-700'
                    }`}>
                      {t.active ? 'Ativo' : 'Revogado'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {t.active && (
                      <button onClick={() => revoke(t.id)}
                        title="Revogar token"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewTokenModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { KeyRound, MapPin, Image as ImageIcon, Landmark, Save, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const StatusBadge = ({ configured }) => (
  configured ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600" data-testid="status-configured">
      <CheckCircle2 size={14} /> Configurado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400" data-testid="status-not-configured">
      Não configurado
    </span>
  )
);

const FranquiaIntegracoesPanel = ({ slug, corPrimaria = '#1a59ad' }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    xgate: { email: '', password: '', api_url: '' },
    google_maps: { api_key: '' },
    cloudinary: { cloud_name: '', api_key: '', api_secret: '' },
    baas: { provider_name: '', api_key: '' },
  });

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/franquias/${slug}/integracoes`, { headers: authHeaders() });
      const integ = res.data.integracoes;
      setData(integ);
      setForm((f) => ({
        ...f,
        xgate: { email: integ.xgate.email || '', password: '', api_url: integ.xgate.api_url || '' },
        cloudinary: { ...f.cloudinary, cloud_name: integ.cloudinary.cloud_name || '' },
        baas: { ...f.baas, provider_name: integ.baas.provider_name || '' },
      }));
    } catch (e) {
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { if (slug) load(); }, [slug, load]);

  const setField = (group, key, value) => {
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/franquias/${slug}/integracoes`, form, { headers: authHeaders() });
      toast.success('Credenciais salvas com segurança');
      // Limpar campos sensíveis após salvar
      setForm((f) => ({
        ...f,
        xgate: { ...f.xgate, password: '' },
        google_maps: { api_key: '' },
        cloudinary: { ...f.cloudinary, api_key: '', api_secret: '' },
        baas: { ...f.baas, api_key: '' },
      }));
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500" data-testid="integracoes-loading">
        <Loader2 className="animate-spin mr-2" size={20} /> Carregando integrações...
      </div>
    );
  }

  const secretPlaceholder = (field) => field?.configured ? `Salvo (${field.masked}) — preencha para alterar` : 'Não configurado';

  return (
    <div className="space-y-6 max-w-3xl" data-testid="integracoes-panel">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={22} />
        <div>
          <h2 className="text-lg font-bold text-gray-800">Integrações / APIs da Franquia</h2>
          <p className="text-sm text-gray-600">As chaves são criptografadas no servidor e nunca aparecem no código. Deixe um campo em branco para manter o valor atual.</p>
        </div>
      </div>

      {/* XGate */}
      <Card className="p-5 space-y-4" data-testid="card-xgate">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800"><KeyRound size={18} style={{ color: corPrimaria }} /> XGate (PIX / Cripto)</div>
          <StatusBadge configured={data?.xgate?.password?.configured} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Email</Label>
            <Input data-testid="xgate-email" value={form.xgate.email} onChange={(e) => setField('xgate', 'email', e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div>
            <Label className="text-xs">Senha</Label>
            <Input data-testid="xgate-password" type="password" value={form.xgate.password} onChange={(e) => setField('xgate', 'password', e.target.value)} placeholder={secretPlaceholder(data?.xgate?.password)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">API URL</Label>
            <Input data-testid="xgate-api-url" value={form.xgate.api_url} onChange={(e) => setField('xgate', 'api_url', e.target.value)} placeholder="https://api.xgateglobal.com" />
          </div>
        </div>
      </Card>

      {/* Google Maps */}
      <Card className="p-5 space-y-4" data-testid="card-gmaps">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800"><MapPin size={18} style={{ color: corPrimaria }} /> Google Maps</div>
          <StatusBadge configured={data?.google_maps?.api_key?.configured} />
        </div>
        <div>
          <Label className="text-xs">API Key</Label>
          <Input data-testid="gmaps-api-key" type="password" value={form.google_maps.api_key} onChange={(e) => setField('google_maps', 'api_key', e.target.value)} placeholder={secretPlaceholder(data?.google_maps?.api_key)} />
          <p className="text-xs text-gray-400 mt-1">Restrinja a chave por domínio no Google Cloud Console.</p>
        </div>
      </Card>

      {/* Cloudinary / Imagens */}
      <Card className="p-5 space-y-4" data-testid="card-cloudinary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800"><ImageIcon size={18} style={{ color: corPrimaria }} /> API de Imagens (Cloudinary)</div>
          <StatusBadge configured={data?.cloudinary?.api_key?.configured} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Cloud Name</Label>
            <Input data-testid="cloudinary-cloud-name" value={form.cloudinary.cloud_name} onChange={(e) => setField('cloudinary', 'cloud_name', e.target.value)} placeholder="cloud_name" />
          </div>
          <div>
            <Label className="text-xs">API Key</Label>
            <Input data-testid="cloudinary-api-key" type="password" value={form.cloudinary.api_key} onChange={(e) => setField('cloudinary', 'api_key', e.target.value)} placeholder={secretPlaceholder(data?.cloudinary?.api_key)} />
          </div>
          <div>
            <Label className="text-xs">API Secret</Label>
            <Input data-testid="cloudinary-api-secret" type="password" value={form.cloudinary.api_secret} onChange={(e) => setField('cloudinary', 'api_secret', e.target.value)} placeholder={secretPlaceholder(data?.cloudinary?.api_secret)} />
          </div>
        </div>
      </Card>

      {/* BaaS */}
      <Card className="p-5 space-y-4" data-testid="card-baas">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800"><Landmark size={18} style={{ color: corPrimaria }} /> BaaS (Banking as a Service)</div>
          <StatusBadge configured={data?.baas?.api_key?.configured} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Provedor</Label>
            <Input data-testid="baas-provider" value={form.baas.provider_name} onChange={(e) => setField('baas', 'provider_name', e.target.value)} placeholder="Ex: Asaas, Dock, Celcoin" />
          </div>
          <div>
            <Label className="text-xs">API Key / Token</Label>
            <Input data-testid="baas-api-key" type="password" value={form.baas.api_key} onChange={(e) => setField('baas', 'api_key', e.target.value)} placeholder={secretPlaceholder(data?.baas?.api_key)} />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-0 bg-white/80 backdrop-blur py-3">
        <Button data-testid="save-integracoes-btn" onClick={save} disabled={saving} className="w-full sm:w-auto" style={{ backgroundColor: corPrimaria }}>
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          Salvar Credenciais
        </Button>
      </div>
    </div>
  );
};

export default FranquiaIntegracoesPanel;

import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Input = ({ ...props }) => (
  <input className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" {...props} />
);

const Label = ({ children }) => (
  <label className="block text-sm font-bold text-[#1a59ad] mb-1">{children}</label>
);

const Select = ({ children, ...props }) => (
  <select className="w-full px-3 py-2 border-2 border-[#1a59ad] bg-[#e3dcda] text-[#1a59ad] rounded-md focus:outline-none focus:border-[#2fa31c] focus:bg-white focus:text-[#1a59ad]" {...props}>
    {children}
  </select>
);

const Textarea = ({ ...props }) => (
  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad] resize-none" rows="3" {...props} />
);

const OPERADORAS = [
  'Algar',
  'Allcom',
  'Arqia',
  'Conct',
  'M2M',
  'BWS',
  'Claro',
  'Datelo',
  'Emnify',
  'Field',
  'Nextel',
  'NLT',
  'Oi',
  'Porto',
  'Sercomtel',
  'TIM',
  'Transmeet',
  'Transmit',
  'Vivo',
  'Vodafone'
];

const TIPOS_EQUIPAMENTO = [
  'Accurate',
  'Allcom',
  'BWS',
  'CalAmp',
  'Carcell',
  'Coban',
  'Concox',
  'E3',
  'Ev02',
  'Genérico',
  'Getrak',
  'Globalstar',
  'Great-Will',
  'Hinova',
  'Império',
  'Iter',
  'J-1',
  'Jimi',
  'KitGPS',
  'LV',
  'Maxtrack',
  'Mobilogix',
  'MultiPortal',
  'Nonus',
  'Positron',
  'Queclink',
  'STC',
  'STG',
  'Sigfox',
  'Suntech',
  'TK 303',
  'TK 311',
  'TOPFLYtech',
  'Teltonika',
  'Tracker',
  'Unigps',
  'VTR300',
  'X3tech',
  'Zhen'
];

const SITUACOES = [
  'Disponível',
  'Instalado',
  'Inativo'
];

const EquipamentoFormModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    empresa: '',
    numero_serie: '',
    numero_imei: '',
    telefone: '',
    operadora: '',
    apn: '',
    usuario: '',
    senha: '',
    tipo: '',
    situacao: 'Disponível',
    observacao: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        empresa: editData.empresa || '',
        numero_serie: editData.numero_serie || '',
        numero_imei: editData.numero_imei || '',
        telefone: editData.telefone || '',
        operadora: editData.operadora || '',
        apn: editData.apn || '',
        usuario: editData.usuario || '',
        senha: editData.senha || '',
        tipo: editData.tipo || '',
        situacao: editData.situacao || 'Disponível',
        observacao: editData.observacao || ''
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.empresa.trim()) {
      toast.error('Digite o nome da empresa');
      return;
    }
    if (!formData.numero_serie.trim()) {
      toast.error('Digite o número de série');
      return;
    }
    if (!formData.operadora) {
      toast.error('Selecione a operadora');
      return;
    }
    if (!formData.tipo) {
      toast.error('Selecione o tipo de equipamento');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      let response;
      if (editData) {
        // Editar
        response = await axios.patch(`${API}/labelview/equipamentos/${editData.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Criar novo
        response = await axios.post(`${API}/labelview/equipamentos`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        toast.success(editData ? 'Equipamento atualizado com sucesso!' : 'Equipamento cadastrado com sucesso!');
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar equipamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c]">
          <div className="flex items-center gap-3">
            <Truck size={32} />
            <div>
              <h2 className="text-2xl font-bold">{editData ? 'Editar' : 'Novo'} Equipamento</h2>
              <p className="text-sm opacity-90">Cadastre equipamentos de rastreamento</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid de 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa */}
            <div>
              <Label>Empresa *</Label>
              <Input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                placeholder="Nome da empresa"
                required
                maxLength={100}
              />
            </div>

            {/* Número de Série */}
            <div>
              <Label>Número de Série *</Label>
              <Input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Número de série do equipamento"
                required
                maxLength={50}
              />
            </div>

            {/* Número IMEI */}
            <div>
              <Label>Número IMEI</Label>
              <Input
                type="text"
                name="numero_imei"
                value={formData.numero_imei}
                onChange={handleChange}
                placeholder="15 dígitos"
                maxLength={15}
              />
            </div>

            {/* Telefone */}
            <div>
              <Label>Telefone</Label>
              <Input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Operadora */}
            <div>
              <Label>Operadora *</Label>
              <Select
                name="operadora"
                value={formData.operadora}
                onChange={handleChange}
                required
              >
                <option value="">Selecione a operadora</option>
                {OPERADORAS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </Select>
            </div>

            {/* APN */}
            <div>
              <Label>APN</Label>
              <Input
                type="text"
                name="apn"
                value={formData.apn}
                onChange={handleChange}
                placeholder="Access Point Name"
                maxLength={50}
              />
            </div>

            {/* Usuário */}
            <div>
              <Label>Usuário</Label>
              <Input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                placeholder="Usuário de acesso"
                maxLength={50}
              />
            </div>

            {/* Senha */}
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Senha de acesso"
                maxLength={50}
              />
            </div>

            {/* Tipo */}
            <div>
              <Label>Tipo *</Label>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o tipo</option>
                {TIPOS_EQUIPAMENTO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </Select>
            </div>

            {/* Situação */}
            <div>
              <Label>Situação *</Label>
              <Select
                name="situacao"
                value={formData.situacao}
                onChange={handleChange}
                required
              >
                {SITUACOES.map(sit => (
                  <option key={sit} value={sit}>{sit}</option>
                ))}
              </Select>
              <div className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <span>Disponível: pronto para uso | Instalado: em uso | Inativo: fora de operação</span>
              </div>
            </div>
          </div>

          {/* Observação - Full width */}
          <div>
            <Label>Observação</Label>
            <Textarea
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              placeholder="Observações sobre o equipamento (opcional)"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.observacao.length}/500 caracteres
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Truck size={20} />
                  {editData ? 'Atualizar' : 'Cadastrar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipamentoFormModal;

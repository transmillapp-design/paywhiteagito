import React, { useState } from 'react';
import { X, List, Building2, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Input = ({ ...props }) => (
  <input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a59ad]" {...props} />
);

const Label = ({ children }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const TipoFornecedorModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo_servico: editData?.tipo_servico || ''
  });

  // Aplicar máscara CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  // Aplicar máscara CNPJ
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  // Aplicar máscara Telefone
  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.tipo_servico.trim()) {
      toast.error('Digite o tipo de serviço');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        tipo_servico: formData.tipo_servico
      };

      let response;
      if (editData) {
        // Editar
        response = await axios.patch(`${API}/labelview/tipos-fornecedor/${editData.id}`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Criar novo
        response = await axios.post(`${API}/labelview/tipos-fornecedor`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        toast.success(editData ? 'Tipo atualizado com sucesso!' : 'Tipo cadastrado com sucesso!');
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar tipo de fornecedor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c]">
          <div className="flex items-center gap-3">
            <List size={32} />
            <div>
              <h2 className="text-2xl font-bold">{editData ? 'Editar' : 'Novo'} Tipo de Fornecedor</h2>
              <p className="text-sm opacity-90">Cadastre categorias de serviços</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Serviço */}
          <div>
            <Label>Tipo de Serviço *</Label>
            <Input
              type="text"
              value={formData.tipo_servico}
              onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
              placeholder="Ex: Rastreadores, Peças Automotivas, Serviços..."
              required
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite o nome da categoria/tipo de fornecedor
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
                  <List size={20} />
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

export default TipoFornecedorModal;

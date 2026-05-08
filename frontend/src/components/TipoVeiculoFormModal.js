import React, { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Input = ({ className, style, ...props }) => (
  <input 
    style={{
      backgroundColor: '#ffffff !important',
      color: '#111827 !important',
      border: '2px solid #d1d5db',
      borderRadius: '6px',
      padding: '8px 12px',
      ...style
    }}
    className={`w-full !bg-white !text-gray-900 focus:outline-none focus:!border-[#1a59ad] ${className || ''}`}
    {...props}
  />
);

const TipoVeiculoFormModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nome: editData.nome || '',
          categoria: editData.categoria || '',
          is_active: editData.is_active !== undefined ? editData.is_active : true
        });
      } else {
        setFormData({
          nome: '',
          categoria: '',
          is_active: true
        });
      }
    }
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      let response;
      if (editData) {
        // Editar
        response = await axios.put(`${API}/labelview/tipos-veiculo/${editData.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Criar novo
        response = await axios.post(`${API}/labelview/tipos-veiculo`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        toast.success(editData ? 'Tipo de veículo atualizado com sucesso!' : 'Tipo de veículo cadastrado com sucesso!');
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de veículo:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar tipo de veículo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{`
        .tipo-veiculo-modal input[type="text"],
        .tipo-veiculo-modal input[type="email"] {
          background-color: #ffffff !important;
          color: #111827 !important;
          border: 2px solid #d1d5db !important;
        }
        .tipo-veiculo-modal input::placeholder {
          color: #9ca3af !important;
        }
      `}</style>
      <div className="tipo-veiculo-modal bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1a59ad] text-white p-6 flex items-center justify-between rounded-t-lg border-b-4 border-[#2fa31c] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Car size={32} />
            <div>
              <h2 className="text-2xl font-bold">{editData ? 'Editar' : 'Novo'} Tipo de Veículo</h2>
              <p className="text-sm opacity-90">Cadastre tipos de veículo para usar nos planos</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          <h3 className="text-lg font-bold mb-6 text-[#1a59ad] pb-3 border-b-2 border-[#2fa31c]">Dados do Tipo de Veículo</h3>
          
          <div className="space-y-5">
            {/* 1. Nome */}
            <div className="grid grid-cols-[150px_1fr] gap-6 items-center">
              <label className="text-sm font-medium text-gray-700 text-right">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Carro, Moto, Caminhão"
                maxLength={100}
                required
              />
            </div>

            {/* 2. Categoria */}
            <div className="grid grid-cols-[150px_1fr] gap-6 items-center">
              <label className="text-sm font-medium text-gray-700 text-right">
                Categoria <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ex: Passeio, Utilitário, Esportivo"
                maxLength={100}
                required
              />
            </div>

            {/* 3. Situação */}
            <div className="grid grid-cols-[150px_1fr] gap-6 items-center">
              <label className="text-sm font-medium text-gray-700 text-right">Situação</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer hover:text-[#2fa31c] transition-colors">
                  <input
                    type="radio"
                    name="is_active"
                    value="true"
                    checked={formData.is_active === true}
                    onChange={() => setFormData({...formData, is_active: true})}
                    className="w-5 h-5 text-[#2fa31c] border-gray-300 focus:ring-[#2fa31c]"
                  />
                  <span className="text-[#2fa31c] font-bold">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors">
                  <input
                    type="radio"
                    name="is_active"
                    value="false"
                    checked={formData.is_active === false}
                    onChange={() => setFormData({...formData, is_active: false})}
                    className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600"
                  />
                  <span className="text-red-600 font-bold">Inativo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Car size={20} />
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

export default TipoVeiculoFormModal;

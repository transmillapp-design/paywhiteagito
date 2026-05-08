import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { Car, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const VeiculoFipeModal = ({ isOpen, onClose, editData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigoFipe: '',
    tipo: 'Carro',
    subcategoria: '',
    marca: '',
    modelo: '',
    ano: '',
    combustivel: '',
    valor: '',
    mesReferencia: '',
    categoria: 'Nacional'
  });

  // Subcategorias por tipo
  const subcategoriasPorTipo = {
    'Carro': ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Picape', 'Coupé', 'Conversível', 'Minivan', 'Station Wagon'],
    'Moto': ['Street', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Adventure', 'Naked'],
    'Caminhão': ['Leve (até 3.5t)', 'Van Baú', 'Utilitário', 'Furgão']
  };

  const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          codigoFipe: editData.codigoFipe || '',
          tipo: editData.tipo || 'Carro',
          subcategoria: editData.subcategoria || '',
          marca: editData.marca || '',
          modelo: editData.modelo || '',
          ano: editData.ano || '',
          combustivel: editData.combustivel || '',
          valor: editData.valor || '',
          mesReferencia: editData.mesReferencia || '',
          categoria: editData.categoria || 'Nacional'
        });
      } else {
        setFormData({
          codigoFipe: '',
          tipo: 'Carro',
          subcategoria: '',
          marca: '',
          modelo: '',
          ano: '',
          combustivel: '',
          valor: '',
          mesReferencia: '',
          categoria: 'Nacional'
        });
      }
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-detectar subcategoria ao mudar o modelo
    if (name === 'modelo' && value) {
      const subcategoriaDetectada = detectarSubcategoria(formData.tipo, value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subcategoria: subcategoriaDetectada || prev.subcategoria
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const detectarSubcategoria = (tipo, modelo) => {
    const modeloLower = modelo.toLowerCase();
    
    if (tipo === 'Carro') {
      // Lista expandida de SUVs
      const suvs = ['suv', 'tucson', 'compass', 'tiguan', 'hrv', 'hr-v', 'kicks', 'creta', 'tracker',
                    'ecosport', 'renegade', 'duster', 'captur', 'pulse', 'fastback', 'nivus',
                    'tcross', 't-cross', 'taos', 'trailblazer', 'equinox', 'sportage', 'sorento',
                    'seltos', 'outlander', 'asx', 'pajero', 'sw4', 'rav4', 'corolla cross',
                    'vitara', 'jimny', 'range rover', 'evoque', 'velar', 'discovery'];
      if (suvs.some(suv => modeloLower.includes(suv))) return 'SUV';
      if (modeloLower.includes('cross') && !modeloLower.includes('crossfox')) return 'Crossover';
      if (modeloLower.includes('picape') || modeloLower.includes('saveiro') || modeloLower.includes('strada') ||
          modeloLower.includes('montana') || modeloLower.includes('toro')) return 'Picape';
      if (modeloLower.includes('sedan') || modeloLower.includes('civic') || modeloLower.includes('corolla') ||
          modeloLower.includes('jetta') || modeloLower.includes('virtus')) return 'Sedan';
      if (modeloLower.includes('van') || modeloLower.includes('doblo') || modeloLower.includes('kangoo')) return 'Minivan';
      if (modeloLower.includes('conversivel') || modeloLower.includes('cabriolet')) return 'Conversível';
      if (modeloLower.includes('coupe') || modeloLower.includes('coupé')) return 'Coupé';
      if (modeloLower.includes('sw') || modeloLower.includes('wagon')) return 'Station Wagon';
      // Default para carros compactos
      return 'Hatchback';
    }
    
    if (tipo === 'Moto') {
      if (modeloLower.includes('sport') || modeloLower.includes('ninja') || modeloLower.includes('cbr')) return 'Sport';
      if (modeloLower.includes('trail') || modeloLower.includes('xre') || modeloLower.includes('lander')) return 'Trail';
      if (modeloLower.includes('custom') || modeloLower.includes('shadow') || modeloLower.includes('dragstar')) return 'Custom';
      if (modeloLower.includes('scooter') || modeloLower.includes('pcx') || modeloLower.includes('nmax')) return 'Scooter';
      if (modeloLower.includes('adventure') || modeloLower.includes('africa') || modeloLower.includes('tiger')) return 'Adventure';
      if (modeloLower.includes('naked') || modeloLower.includes('cb ') || modeloLower.includes('mt-')) return 'Naked';
      return 'Street';
    }
    
    if (tipo === 'Caminhão') {
      if (modeloLower.includes('bongo') || modeloLower.includes('effa') || modeloLower.includes('hr')) return 'Leve (até 3.5t)';
      if (modeloLower.includes('van') || modeloLower.includes('bau') || modeloLower.includes('baú') ||
          modeloLower.includes('furgao') || modeloLower.includes('furgão')) return 'Van Baú';
      return 'Utilitário';
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.marca.trim() || !formData.modelo.trim()) {
      toast.error('Marca e Modelo são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      let response;
      if (editData) {
        // Editar
        response = await axios.patch(`${API}/labelview/fipe/veiculo/${editData.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Criar novo
        response = await axios.post(`${API}/labelview/fipe/veiculo`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        toast.success(editData ? 'Veículo atualizado!' : 'Veículo cadastrado!');
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="veiculo-fipe-modal bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c] rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <Car size={28} />
            <div>
              <h2 className="text-xl font-bold">{editData ? 'Editar' : 'Novo'} Veículo FIPE</h2>
              <p className="text-sm opacity-90">Cadastre veículos na tabela local</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Linha 1: Código FIPE e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Código FIPE</label>
                <input
                  type="text"
                  name="codigoFipe"
                  value={formData.codigoFipe}
                  onChange={handleChange}
                  placeholder="Ex: 001004-1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Tipo *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, tipo: e.target.value, subcategoria: '' }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                >
                  <option value="Carro">Carro</option>
                  <option value="Moto">Moto</option>
                  <option value="Caminhão">Caminhão (Leve)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">
                  Subcategoria
                  <span className="text-xs text-gray-500 ml-2">(auto-detecta)</span>
                </label>
                <select
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {subcategoriasPorTipo[formData.tipo].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Marca e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Marca *</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ex: Volkswagen"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Modelo *</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ex: Gol 1.0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>
            </div>

            {/* Linha 3: Ano e Combustível */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Ano</label>
                <input
                  type="text"
                  name="ano"
                  value={formData.ano}
                  onChange={handleChange}
                  placeholder="Ex: 2023"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Combustível</label>
                <select
                  name="combustivel"
                  value={formData.combustivel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Etanol">Etanol</option>
                  <option value="Flex">Flex</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GNV">GNV</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Linha 4: Valor e Mês Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Valor</label>
                <input
                  type="text"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="Ex: R$ 50.000,00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a59ad] mb-1">Mês Referência</label>
                <input
                  type="text"
                  name="mesReferencia"
                  value={formData.mesReferencia}
                  onChange={handleChange}
                  placeholder="Ex: Dezembro/2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
                />
              </div>
            </div>

            {/* Linha 5: Categoria */}
            <div>
              <label className="block text-sm font-medium text-[#1a59ad] mb-1">Categoria</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a59ad] focus:border-transparent"
              >
                <option value="Nacional">Nacional</option>
                <option value="Importado">Importado</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t mt-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-[#1a59ad] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#1a59ad] hover:bg-[#2fa31c] text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Car size={18} />
                    {editData ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VeiculoFipeModal;

import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import CotacaoConsultorLabelview from './CotacaoConsultorLabelview';

const API = typeof API_URL === 'function' ? API_URL() : API_URL;

const CotacaoPublica = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarLink();
  }, [userId]);

  const verificarLink = async () => {
    try {
      setLoading(true);
      
      // Obter userId da URL (path ou query parameter)
      const searchParams = new URLSearchParams(window.location.search);
      const refCode = searchParams.get('ref');
      const userIdToUse = userId || refCode;
      
      if (!userIdToUse) {
        setError('Link inválido - falta identificação do consultor');
        setLoading(false);
        return;
      }
      
      // Buscar informações do vendedor (Master/Unidade/Regional/Consultor)
      const response = await axios.get(`${API}/labelview/verificar-link/${userIdToUse}`);
      
      if (response.data.success) {
        setVendedor(response.data.vendedor);
      } else {
        setError('Link inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar link:', error);
      setError('Link inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a59ad] to-[#2fa31c] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a59ad] to-[#2fa31c] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <Shield size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#1a59ad] text-white px-6 py-3 rounded-lg hover:bg-[#154a93]"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Header com informações do vendedor */}
      <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            {vendedor?.logo_url && (
              <img 
                src={vendedor.logo_url} 
                alt="Logo" 
                className="w-16 h-16 rounded-full bg-white p-2"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">Proteção Veicular</h1>
              <p className="text-white/90">
                Cotação por: {vendedor?.full_name || vendedor?.nome_fantasia || 'Consultor'}
              </p>
              {vendedor?.user_type && (
                <p className="text-xs text-white/70">
                  {vendedor.user_type === 'labelview_master' && 'Master Labelview'}
                  {vendedor.user_type === 'labelview_unidade' && 'Unidade'}
                  {vendedor.user_type === 'labelview_regional' && 'Regional'}
                  {vendedor.user_type === 'labelview_consultor' && 'Consultor'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de cotação */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            ℹ️ Este link foi compartilhado com você. Preencha os dados abaixo para receber uma cotação personalizada.
          </p>
        </div>

        {/* Componente de cotação com contexto do vendedor */}
        <CotacaoConsultorLabelview 
          publicMode={true}
          vendedorId={userId}
          vendedorData={vendedor}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2024 Transmill - Proteção Veicular</p>
          <p className="text-xs text-gray-400 mt-2">
            Cotação gerada por: {vendedor?.full_name || vendedor?.nome_fantasia}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CotacaoPublica;

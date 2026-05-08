import React, { useState, useEffect } from 'react';
import { X, Percent, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const EditarPlanoModal = ({ isOpen, onClose, plano, onSuccess }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [percentuais, setPercentuais] = useState({});
  const [adicionaisHabilitados, setAdicionaisHabilitados] = useState({});

  // Lista completa de adicionais possíveis
  const todosAdicionais = [
    'Assistencia 24hs',
    'Vidros, Farois e Lanternas',
    'Carro Reserva',
    'Colisão',
    'Danos materiais e Terceiros',
    'Perda Total'
  ];

  useEffect(() => {
    if (plano && isOpen) {
      // Inicializar percentuais com valores atuais
      const percInicial = {};
      const habilitados = {};
      
      // Coberturas principais
      if (plano.coberturas_principais) {
        plano.coberturas_principais.forEach(cob => {
          percInicial[cob.tipo_cobertura] = cob.percentual_unidade || 0;
        });
      }
      
      // Adicionais existentes
      if (plano.adicionais) {
        plano.adicionais.forEach(ad => {
          percInicial[ad.tipo_cobertura] = ad.percentual_unidade || 0;
          habilitados[ad.tipo_cobertura] = true;
        });
      }
      
      // Inicializar adicionais não existentes como desabilitados
      todosAdicionais.forEach(adicional => {
        if (!habilitados[adicional]) {
          habilitados[adicional] = false;
          percInicial[adicional] = 0;
        }
      });
      
      setPercentuais(percInicial);
      setAdicionaisHabilitados(habilitados);
    }
  }, [plano, isOpen]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Filtrar apenas percentuais de adicionais habilitados
      const percentuaisParaEnviar = {};
      
      // Coberturas principais sempre enviam
      if (plano.coberturas_principais) {
        plano.coberturas_principais.forEach(cob => {
          percentuaisParaEnviar[cob.tipo_cobertura] = percentuais[cob.tipo_cobertura] || 0;
        });
      }
      
      // Adicionais: enviar apenas os habilitados
      todosAdicionais.forEach(adicional => {
        if (adicionaisHabilitados[adicional]) {
          percentuaisParaEnviar[adicional] = percentuais[adicional] || 0;
        }
      });

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/labelview/planos/${plano.id}/editar-percentuais`,
        { percentuais: percentuaisParaEnviar },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Percentuais atualizados com sucesso!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao editar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar percentuais');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !plano) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-6 flex items-center justify-between rounded-t-lg z-10">
          <div>
            <h2 className="text-2xl font-bold">Editar Percentuais</h2>
            <p className="text-sm text-white/80 mt-1">
              {plano.tipo_veiculo} - Faixa R$ {(plano.valor_fipe_min / 1000).toFixed(0)}k - {(plano.valor_fipe_max / 1000).toFixed(0)}k
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Taxa de Adesão - Info */}
          {plano.taxa_adesao !== undefined && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Taxa de Adesão:</span>
                <span className="text-lg font-bold text-blue-600">
                  R$ {plano.taxa_adesao?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Valor único cobrado na adesão (não pode ser editado aqui)
              </p>
            </div>
          )}

          {/* Coberturas Principais */}
          {plano.coberturas_principais && plano.coberturas_principais.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Cobertura Principal
              </h3>
              <div className="space-y-3">
                {plano.coberturas_principais.map(cobertura => (
                  <div key={cobertura.tipo_cobertura} className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">{cobertura.tipo_cobertura}</span>
                      <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                        Principal
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Valor Base (Master)</label>
                        <div className="text-sm font-medium text-gray-800">
                          R$ {cobertura.valor_base_master?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Percentual Atual</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={percentuais[cobertura.tipo_cobertura] || 0}
                            onChange={(e) => setPercentuais({
                              ...percentuais,
                              [cobertura.tipo_cobertura]: parseFloat(e.target.value) || 0
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                          />
                          <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Simulação do novo valor */}
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Novo valor de venda:</span>
                        <span className="font-bold text-[#2fa31c]">
                          R$ {(
                            (cobertura.valor_base_master || 0) * 
                            (1 + (percentuais[cobertura.tipo_cobertura] || 0) / 100)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionais - Todos os possíveis */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Adicionais <span className="text-sm text-gray-600">(marque para adicionar)</span>
            </h3>
            <div className="space-y-3">
              {todosAdicionais.map(nomeAdicional => {
                const adicionalExistente = plano.adicionais?.find(a => a.tipo_cobertura === nomeAdicional);
                const habilitado = adicionaisHabilitados[nomeAdicional];
                
                return (
                  <div key={nomeAdicional} className={`border rounded-lg p-4 transition-colors ${
                    habilitado ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={habilitado}
                        onChange={(e) => {
                          setAdicionaisHabilitados({
                            ...adicionaisHabilitados,
                            [nomeAdicional]: e.target.checked
                          });
                          if (!e.target.checked) {
                            setPercentuais({
                              ...percentuais,
                              [nomeAdicional]: 0
                            });
                          }
                        }}
                        className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{nomeAdicional}</span>
                          {adicionalExistente ? (
                            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">
                              Existente
                            </span>
                          ) : (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Novo
                            </span>
                          )}
                        </div>
                        
                        {habilitado && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              {adicionalExistente && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Valor Base (Master)</label>
                                  <div className="text-sm font-medium text-gray-800">
                                    R$ {adicionalExistente.valor_base_master?.toFixed(2) || '0.00'}
                                  </div>
                                </div>
                              )}
                              <div className={adicionalExistente ? '' : 'col-span-2'}>
                                <label className="block text-xs text-gray-600 mb-1">Percentual</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={percentuais[nomeAdicional] || 0}
                                    onChange={(e) => setPercentuais({
                                      ...percentuais,
                                      [nomeAdicional]: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Ex: 15"
                                  />
                                  <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                            {!adicionalExistente && (
                              <p className="text-xs text-blue-600 mt-2">
                                💡 Este adicional será adicionado ao plano
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save size={16} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarPlanoModal;

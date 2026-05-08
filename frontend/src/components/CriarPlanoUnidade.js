import React, { useState, useEffect } from 'react';
import { X, Shield, Percent, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { Checkbox } from './ui/checkbox';

const CriarPlanoUnidade = ({ isOpen, onClose, onSuccess }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Dados do formulário
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [taxaAdesao, setTaxaAdesao] = useState('');
  
  // Coberturas PRINCIPAIS (entram no valor do plano) - APENAS ROUBO/FURTO
  const [coberturasPrincipais, setCoberturasPrincipais] = useState({
    'Roubo/Furto': { selecionado: true, percentual: '', obrigatorio: true, tipo: 'principal' }
  });
  
  // ADICIONAIS (NÃO entram no valor do plano - só na cotação)
  const [adicionais, setAdicionais] = useState({
    'Assistencia 24hs': { selecionado: false, percentual: '', tipo: 'adicional' },
    'Vidros, Farois e Lanternas': { selecionado: false, percentual: '', tipo: 'adicional' },
    'Carro Reserva': { selecionado: false, percentual: '', tipo: 'adicional' },
    'Colisão': { selecionado: false, percentual: '', tipo: 'adicional' },
    'Danos materiais e Terceiros': { selecionado: false, percentual: '', tipo: 'adicional' },
    'Perda Total': { selecionado: false, percentual: '', tipo: 'adicional' }
  });

  const tiposVeiculo = [
    'Carros Leves',
    'Aplicativos',
    'Moto',
    'SUV, Pickup, Van',
    'Caminhão'
  ];

  const handleCoberturaChange = (nome, campo, valor, tipo) => {
    if (tipo === 'principal') {
      setCoberturasPrincipais(prev => ({
        ...prev,
        [nome]: {
          ...prev[nome],
          [campo]: valor
        }
      }));
    } else {
      setAdicionais(prev => ({
        ...prev,
        [nome]: {
          ...prev[nome],
          [campo]: valor
        }
      }));
    }
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit iniciado');
    
    // Validações
    if (!tipoVeiculo) {
      toast.error('Selecione o tipo de veículo');
      return;
    }

    // Validar taxa de adesão
    if (!taxaAdesao || parseFloat(taxaAdesao) < 0) {
      toast.error('Informe a taxa de adesão (pode ser 0)');
      return;
    }

    // Validar Roubo/Furto
    if (!coberturasPrincipais['Roubo/Furto'].percentual || parseFloat(coberturasPrincipais['Roubo/Furto'].percentual) <= 0) {
      toast.error('Informe o percentual de Roubo/Furto');
      return;
    }

    // Coberturas principais selecionadas
    const principaisSelecionadas = Object.entries(coberturasPrincipais).filter(([nome, dados]) => 
      dados.selecionado && dados.percentual && parseFloat(dados.percentual) > 0
    );

    if (principaisSelecionadas.length === 0) {
      toast.error('Selecione pelo menos a cobertura principal (Roubo/Furto)');
      return;
    }

    // Adicionais selecionados
    const adicionaisSelecionados = Object.entries(adicionais).filter(([nome, dados]) => 
      dados.selecionado && dados.percentual && parseFloat(dados.percentual) > 0
    );

    try {
      setLoading(true);
      
      const payload = {
        tipo_veiculo: tipoVeiculo,
        taxa_adesao: parseFloat(taxaAdesao),
        coberturas_principais: principaisSelecionadas.map(([nome, dados]) => ({
          tipo_cobertura: nome,
          percentual: parseFloat(dados.percentual),
          tipo: 'principal'
        })),
        adicionais: adicionaisSelecionados.map(([nome, dados]) => ({
          tipo_cobertura: nome,
          percentual: parseFloat(dados.percentual),
          tipo: 'adicional'
        }))
      };

      // Log sem dados sensíveis
      console.log('📤 Criando planos automáticos...');

      const token = localStorage.getItem('token');
      
      toast.loading('Criando 12 planos...', { id: 'criar-planos' });
      
      const response = await axios.post(
        `${API}/labelview/planos/criar-automatico`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Response:', response.data);

      if (response.data.success) {
        toast.success(
          `✅ ${response.data.total_planos_criados} planos criados com sucesso!`,
          { id: 'criar-planos' }
        );
        onSuccess();
        handleClose();
      } else {
        toast.error('Falha ao criar planos', { id: 'criar-planos' });
      }
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Response:', error.response);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao criar planos';
      toast.error(errorMessage, { id: 'criar-planos' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTipoVeiculo('');
    setCoberturasPrincipais({
      'Roubo/Furto': { selecionado: true, percentual: '', obrigatorio: true, tipo: 'principal' }
    });
    setAdicionais({
      'Assistencia 24hs': { selecionado: false, percentual: '', tipo: 'adicional' },
      'Vidros, Farois e Lanternas': { selecionado: false, percentual: '', tipo: 'adicional' },
      'Carro Reserva': { selecionado: false, percentual: '', tipo: 'adicional' },
      'Colisão': { selecionado: false, percentual: '', tipo: 'adicional' },
      'Danos materiais e Terceiros': { selecionado: false, percentual: '', tipo: 'adicional' },
      'Perda Total': { selecionado: false, percentual: '', tipo: 'adicional' }
    });
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-6 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Shield size={28} />
            <div>
              <h2 className="text-2xl font-bold">Criar Planos Automáticos</h2>
              <p className="text-sm text-white/80">Sistema criará 12 planos (uma para cada faixa FIPE)</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Alerta informativo */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Selecione o tipo de veículo</li>
                  <li>Defina o percentual para cada cobertura que deseja oferecer</li>
                  <li>Sistema criará automaticamente 12 planos (R$ 0-10k, 10k-20k, até 110k-120k)</li>
                  <li>Seus clientes verão apenas os valores finais (sem visualizar o percentual)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tipo de Veículo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Tipo de Veículo <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoVeiculo}
              onChange={(e) => setTipoVeiculo(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
            >
              <option value="">Selecione o tipo de veículo</option>
              {tiposVeiculo.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Taxa de Adesão */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <label className="block text-sm font-semibold text-orange-700 mb-2">
              2. Taxa de Adesão (R$) <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-orange-600 mb-3">
              💰 Valor único cobrado na primeira mensalidade • 100% fica com quem vende • Pago à vista via carteira Transmill
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={taxaAdesao}
              onChange={(e) => setTaxaAdesao(e.target.value)}
              placeholder="Ex: 100.00 (Moto pode ter valor menor que Caminhão)"
              className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-600 mt-2">
              💡 <strong>Dica:</strong> Você pode definir valores diferentes por tipo de veículo (ex: Moto R$ 50, Caminhão R$ 150)
            </p>
          </div>

          {/* Coberturas PRINCIPAIS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              3. Cobertura PRINCIPAL <span className="text-xs text-gray-500">(obrigatória - valor base do plano)</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              ⚠️ Roubo/Furto é a única cobertura principal e forma o valor base do plano
            </p>

            <div className="space-y-3">
              {Object.entries(coberturasPrincipais).map(([nome, dados]) => {
                const isRouboFurto = nome === 'Roubo/Furto';
                const isDanosMateriais = nome === 'Danos materiais e Terceiros';
                
                return (
                  <div 
                    key={nome}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      dados.selecionado 
                        ? 'border-[#2fa31c] bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={dados.selecionado}
                        disabled={dados.obrigatorio}
                        onCheckedChange={(checked) => handleCoberturaChange(nome, 'selecionado', checked, 'principal')}
                        className="mt-1 h-5 w-5 border-2 border-[#2fa31c] data-[state=checked]:bg-[#2fa31c] data-[state=checked]:border-[#2fa31c]"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              {isRouboFurto && <Shield size={18} className="text-[#2fa31c]" />}
                              {nome}
                              {isRouboFurto && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  Obrigatória
                                </span>
                              )}
                            </h3>
                            {isRouboFurto && (
                              <p className="text-xs text-gray-600 mt-1">
                                Cobertura principal obrigatória
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Campo de percentual */}
                        {(dados.selecionado || isRouboFurto) && (
                          <div className="mt-3 space-y-3">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Percentual da Unidade (%)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={dados.percentual}
                                    onChange={(e) => handleCoberturaChange(nome, 'percentual', e.target.value, 'principal')}
                                    placeholder="Ex: 20"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2fa31c] focus:border-transparent"
                                  />
                                  <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Nota especial para Danos Materiais */}
                            {isDanosMateriais && (
                              <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded mt-2 border border-purple-200">
                                <strong>⚠️ Importante:</strong> Sistema criará automaticamente 3 opções de limite:
                                <ul className="list-disc list-inside mt-1 ml-2">
                                  <li>Limite R$ 30.000</li>
                                  <li>Limite R$ 60.000</li>
                                  <li>Limite R$ 100.000</li>
                                </ul>
                              </div>
                            )}

                            {dados.percentual && parseFloat(dados.percentual) > 0 && (
                              <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                <span className="font-medium">Cálculo:</span> Valor Tabela + {dados.percentual}%
                                <br />
                                <span className="text-xs">Ex: R$ 100,00 → <span className="font-semibold text-[#2fa31c]">
                                  R$ {(100 * (1 + parseFloat(dados.percentual) / 100)).toFixed(2)}
                                </span></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADICIONAIS (não entram no valor do plano) */}
          <div className="border-t-2 border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              4. ADICIONAIS <span className="text-xs text-orange-600">(opcional - somam apenas na cotação)</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              💡 Estes adicionais estarão disponíveis para o cliente escolher durante a cotação
            </p>

            <div className="space-y-3">
              {Object.entries(adicionais).map(([nome, dados]) => (
                <div 
                  key={nome}
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    dados.selecionado 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    console.log(`Card ${nome} clicked, toggling`);
                    handleCoberturaChange(nome, 'selecionado', !dados.selecionado, 'adicional');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      data-testid={`adicional-${nome.replace(/\s+/g, '-').toLowerCase()}-checkbox`}
                      checked={dados.selecionado}
                      onCheckedChange={(checked) => {
                        console.log(`Checkbox ${nome} changed to:`, checked);
                        handleCoberturaChange(nome, 'selecionado', checked, 'adicional');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-5 w-5 border-2 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800">{nome}</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Cliente decide se quer na hora da cotação
                      </p>

                      {dados.selecionado && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Percentual da Unidade (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              data-testid={`adicional-${nome.replace(/\s+/g, '-').toLowerCase()}-percentual`}
                              min="0"
                              max="100"
                              step="0.01"
                              value={dados.percentual}
                              onChange={(e) => {
                                console.log(`Percentual ${nome} changed to:`, e.target.value);
                                handleCoberturaChange(nome, 'percentual', e.target.value, 'adicional');
                              }}
                              placeholder="Ex: 15"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                          </div>
                          
                          {dados.percentual && parseFloat(dados.percentual) > 0 && (
                            <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mt-2">
                              <span className="font-medium">Cálculo:</span> Valor Tabela + {dados.percentual}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          {tipoVeiculo && coberturasPrincipais['Roubo/Furto'].percentual && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-[#2fa31c] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-[#2fa31c]" size={20} />
                <h3 className="font-semibold text-gray-800">Resumo da Criação</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• <span className="font-medium">Tipo:</span> {tipoVeiculo}</p>
                <p>• <span className="font-medium">Taxa de Adesão:</span> R$ {parseFloat(taxaAdesao || 0).toFixed(2)}</p>
                <p>• <span className="font-medium">Coberturas principais:</span> {
                  Object.entries(coberturasPrincipais)
                    .filter(([_, dados]) => dados.selecionado && dados.percentual)
                    .length
                }</p>
                <p>• <span className="font-medium">Adicionais:</span> {
                  Object.entries(adicionais)
                    .filter(([_, dados]) => dados.selecionado && dados.percentual)
                    .length
                }</p>
                <p>• <span className="font-medium">Planos que serão criados:</span> 12 (uma para cada faixa FIPE)</p>
                <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-300">
                  Os clientes verão apenas os valores finais de venda, sem visualizar os percentuais aplicados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
              onClick={handleSubmit}
              disabled={loading || !tipoVeiculo || !taxaAdesao || !coberturasPrincipais['Roubo/Furto']?.percentual}
              className="px-6 py-2 bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Criar 12 Planos Automaticamente
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CriarPlanoUnidade;

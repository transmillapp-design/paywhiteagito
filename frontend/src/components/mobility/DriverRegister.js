/**
 * Driver Register - Transmill Mobility
 * Tela de cadastro/edição do perfil de motorista (Tela 16 do PRD)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  ArrowLeft, Car, DollarSign, Gift, Save, Loader2,
  CheckCircle, AlertCircle, Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const DriverRegister = () => {
  const navigate = useNavigate();
  const { token, user, API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    // Veículo
    tipo: 'carro',
    modelo: '',
    cor: '',
    placa: '',
    ano: '',
    // Tarifas
    taxa_minima: '8.00',
    valor_por_km: '2.50',
    cashback_percentage: '5'
  });

  const [errors, setErrors] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const theme = localStorage.getItem('transmill-theme');
    setIsDarkMode(theme === 'dark');
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const response = await axios.get(`${API}/mobility/driver/profile`, { headers });
      if (response.data.exists && response.data.profile) {
        setIsEditing(true);
        const profile = response.data.profile;
        setFormData({
          tipo: profile.vehicle?.tipo || 'carro',
          modelo: profile.vehicle?.modelo || '',
          cor: profile.vehicle?.cor || '',
          placa: profile.vehicle?.placa || '',
          ano: profile.vehicle?.ano?.toString() || '',
          taxa_minima: profile.pricing?.taxa_minima?.toFixed(2) || '8.00',
          valor_por_km: profile.pricing?.valor_por_km?.toFixed(2) || '2.50',
          cashback_percentage: profile.pricing?.cashback_percentage?.toString() || '5'
        });
      }
    } catch (error) {
      console.log('Usuário não é motorista');
    }
    setLoadingProfile(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro quando usuário digita
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validações do veículo
    if (!formData.modelo.trim()) {
      newErrors.modelo = 'Modelo do veículo é obrigatório';
    }
    if (!formData.cor.trim()) {
      newErrors.cor = 'Cor do veículo é obrigatória';
    }
    if (!formData.placa.trim()) {
      newErrors.placa = 'Placa do veículo é obrigatória';
    } else if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i.test(formData.placa.replace('-', ''))) {
      newErrors.placa = 'Formato de placa inválido (ex: ABC1D23 ou ABC1234)';
    }

    // Validações das tarifas
    const taxaMinima = parseFloat(formData.taxa_minima);
    if (isNaN(taxaMinima) || taxaMinima < 5) {
      newErrors.taxa_minima = 'Taxa mínima deve ser pelo menos R$ 5,00';
    }
    if (taxaMinima > 50) {
      newErrors.taxa_minima = 'Taxa mínima não pode exceder R$ 50,00';
    }

    const valorPorKm = parseFloat(formData.valor_por_km);
    if (isNaN(valorPorKm) || valorPorKm < 1) {
      newErrors.valor_por_km = 'Valor por km deve ser pelo menos R$ 1,00';
    }
    if (valorPorKm > 10) {
      newErrors.valor_por_km = 'Valor por km não pode exceder R$ 10,00';
    }

    const cashback = parseFloat(formData.cashback_percentage);
    if (isNaN(cashback) || cashback < 0) {
      newErrors.cashback_percentage = 'Cashback deve ser 0% ou mais';
    }
    if (cashback > 10) {
      newErrors.cashback_percentage = 'Cashback não pode exceder 10%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vehicle: {
          tipo: formData.tipo,
          modelo: formData.modelo.trim(),
          cor: formData.cor.trim(),
          placa: formData.placa.toUpperCase().replace('-', ''),
          ano: formData.ano ? parseInt(formData.ano) : null
        },
        pricing: {
          taxa_minima: parseFloat(formData.taxa_minima),
          valor_por_km: parseFloat(formData.valor_por_km),
          cashback_percentage: parseFloat(formData.cashback_percentage)
        }
      };

      if (isEditing) {
        // Atualizar perfil existente
        await axios.put(`${API}/mobility/driver/profile`, payload, { headers });
        toast.success('Perfil atualizado com sucesso!');
      } else {
        // Criar novo perfil de motorista
        await axios.post(`${API}/mobility/driver/register`, payload, { headers });
        toast.success('Cadastro de motorista realizado com sucesso!');
      }

      // Navegar para o painel do motorista
      navigate('/mobility/driver');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar perfil';
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  // Cores do tema
  const colors = isDarkMode ? {
    bg: 'bg-[#1a59ad]',
    card: 'bg-[#6B6A4B]',
    text: 'text-white',
    textSecondary: 'text-[#CEAE31]',
    textMuted: 'text-gray-300',
    primary: 'bg-[#CEAE31] text-[#1a59ad]',
    secondary: 'bg-transparent border-2 border-[#CEAE31] text-[#CEAE31]',
    border: 'border-[#CEAE31]',
    input: 'bg-[#1a59ad] border-[#CEAE31] text-white placeholder:text-gray-400'
  } : {
    bg: 'bg-[#F5F5F5]',
    card: 'bg-white',
    text: 'text-[#333333]',
    textSecondary: 'text-[#005B9C]',
    textMuted: 'text-gray-500',
    primary: 'bg-[#005B9C] text-white',
    secondary: 'bg-transparent border-2 border-[#005B9C] text-[#005B9C]',
    border: 'border-[#005B9C]',
    input: 'bg-white border-gray-300 text-[#333333] placeholder:text-gray-500'
  };

  if (loadingProfile) {
    return (
      <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
        <Loader2 className={`animate-spin ${colors.textSecondary}`} size={48} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg}`}>
      {/* Header */}
      <header className={`${colors.card} shadow-sm sticky top-0 z-50`}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobility')}
              className={colors.text}
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="ml-3">
              <h1 className={`text-xl font-bold ${colors.text}`}>
                {isEditing ? 'Editar Perfil' : 'Cadastro de Motorista'}
              </h1>
              <p className={`text-sm ${colors.textMuted}`}>
                {isEditing ? 'Atualize seus dados' : 'Configure seu veículo e tarifas'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card do Veículo */}
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Car className={colors.textSecondary} size={24} />
                <CardTitle className={colors.text}>Veículo</CardTitle>
              </div>
              <CardDescription className={colors.textMuted}>
                Informações do seu veículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Veículo */}
              <div>
                <Label className={colors.text}>Tipo de Veículo</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: 'carro', label: 'Carro' },
                    { value: 'moto', label: 'Moto' },
                    { value: 'suv', label: 'SUV' },
                    { value: 'van', label: 'Van' }
                  ].map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.value }))}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        formData.tipo === tipo.value
                          ? colors.primary
                          : `${colors.card} border ${colors.border} ${colors.text}`
                      }`}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modelo */}
              <div>
                <Label className={colors.text}>Modelo *</Label>
                <Input
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  placeholder="Ex: Honda Civic 2020"
                  className={`mt-1 ${colors.input} ${errors.modelo ? 'border-red-500' : ''}`}
                />
                {errors.modelo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.modelo}
                  </p>
                )}
              </div>

              {/* Cor */}
              <div>
                <Label className={colors.text}>Cor *</Label>
                <Input
                  name="cor"
                  value={formData.cor}
                  onChange={handleInputChange}
                  placeholder="Ex: Prata"
                  className={`mt-1 ${colors.input} ${errors.cor ? 'border-red-500' : ''}`}
                />
                {errors.cor && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.cor}
                  </p>
                )}
              </div>

              {/* Placa */}
              <div>
                <Label className={colors.text}>Placa *</Label>
                <Input
                  name="placa"
                  value={formData.placa}
                  onChange={handleInputChange}
                  placeholder="Ex: ABC1D23"
                  maxLength={7}
                  className={`mt-1 ${colors.input} uppercase ${errors.placa ? 'border-red-500' : ''}`}
                />
                {errors.placa && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.placa}
                  </p>
                )}
              </div>

              {/* Ano */}
              <div>
                <Label className={colors.text}>Ano (opcional)</Label>
                <Input
                  name="ano"
                  value={formData.ano}
                  onChange={handleInputChange}
                  placeholder="Ex: 2020"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className={`mt-1 ${colors.input}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card das Tarifas */}
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className={colors.textSecondary} size={24} />
                <CardTitle className={colors.text}>Tarifas</CardTitle>
              </div>
              <CardDescription className={colors.textMuted}>
                Defina seus valores de corrida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Taxa Mínima */}
              <div>
                <Label className={colors.text}>Taxa Mínima (R$) *</Label>
                <div className="relative mt-1">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.textMuted}`}>R$</span>
                  <Input
                    name="taxa_minima"
                    value={formData.taxa_minima}
                    onChange={handleInputChange}
                    type="number"
                    step="0.50"
                    min="5"
                    max="50"
                    className={`pl-10 ${colors.input} ${errors.taxa_minima ? 'border-red-500' : ''}`}
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  Valor mínimo que você receberá por corrida (R$ 5 - R$ 50)
                </p>
                {errors.taxa_minima && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.taxa_minima}
                  </p>
                )}
              </div>

              {/* Valor por Km */}
              <div>
                <Label className={colors.text}>Valor por Km (R$) *</Label>
                <div className="relative mt-1">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.textMuted}`}>R$</span>
                  <Input
                    name="valor_por_km"
                    value={formData.valor_por_km}
                    onChange={handleInputChange}
                    type="number"
                    step="0.10"
                    min="1"
                    max="10"
                    className={`pl-10 ${colors.input} ${errors.valor_por_km ? 'border-red-500' : ''}`}
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  Valor cobrado por quilômetro rodado (R$ 1 - R$ 10)
                </p>
                {errors.valor_por_km && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.valor_por_km}
                  </p>
                )}
              </div>

              {/* Cashback */}
              <div>
                <div className="flex items-center space-x-2">
                  <Gift className="text-green-500" size={20} />
                  <Label className={colors.text}>Cashback para Passageiro (%)</Label>
                </div>
                <div className="relative mt-1">
                  <Input
                    name="cashback_percentage"
                    value={formData.cashback_percentage}
                    onChange={handleInputChange}
                    type="number"
                    step="1"
                    min="0"
                    max="10"
                    className={`pr-8 ${colors.input} ${errors.cashback_percentage ? 'border-red-500' : ''}`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.textMuted}`}>%</span>
                </div>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  Cashback que você oferece ao passageiro (0% - 10%). Mais cashback = mais corridas!
                </p>
                {errors.cashback_percentage && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.cashback_percentage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Exemplo */}
          <Card className={`${colors.card} border ${colors.border}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Info className={colors.textSecondary} size={20} />
                <CardTitle className={`text-base ${colors.text}`}>Exemplo de Corrida (10 km)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const distancia = 10;
                const taxaMinima = parseFloat(formData.taxa_minima) || 8;
                const valorKm = parseFloat(formData.valor_por_km) || 2.5;
                const cashbackPct = parseFloat(formData.cashback_percentage) || 5;
                
                const valorCalculado = distancia * valorKm;
                const total = Math.max(taxaMinima, valorCalculado);
                const taxaPlataforma = total * 0.10;
                const cashback = total * (cashbackPct / 100);
                const ganhoMotorista = total - taxaPlataforma - cashback;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={colors.textMuted}>Valor da corrida</span>
                      <span className={colors.text}>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={colors.textMuted}>Taxa plataforma (10%)</span>
                      <span className="text-red-400">- R$ {taxaPlataforma.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={colors.textMuted}>Cashback ({cashbackPct}%)</span>
                      <span className="text-red-400">- R$ {cashback.toFixed(2)}</span>
                    </div>
                    <div className={`h-px ${isDarkMode ? 'bg-[#CEAE31]/30' : 'bg-gray-200'} my-2`}></div>
                    <div className="flex justify-between font-bold">
                      <span className={colors.text}>Seu ganho</span>
                      <span className={colors.textSecondary}>R$ {ganhoMotorista.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Aviso */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#CEAE31]/20' : 'bg-blue-50'}`}>
            <div className="flex items-start space-x-3">
              <CheckCircle className={isDarkMode ? 'text-[#CEAE31]' : 'text-blue-500'} size={20} />
              <div>
                <p className={`text-sm font-medium ${colors.text}`}>
                  Você pode alterar suas tarifas a qualquer momento
                </p>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  As mudanças serão aplicadas nas próximas corridas
                </p>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-14 text-lg ${colors.primary}`}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={24} />
            ) : (
              <Save className="mr-2" size={24} />
            )}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar como Motorista'}
          </Button>

          {/* Botão Cancelar */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/mobility')}
            className={`w-full ${colors.textMuted}`}
          >
            Cancelar
          </Button>
        </form>
      </main>
    </div>
  );
};

export default DriverRegister;

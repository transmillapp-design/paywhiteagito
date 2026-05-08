import React, { useState } from 'react';
import { X, Upload, Eye, EyeOff, Camera, FileText, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const ColaboradorFormModal = ({ isOpen, onClose, onSuccess, API, token }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    email: '',
    whatsapp: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cargo: '',
    regional: '',
    commission_percentage: 0
  });

  const [files, setFiles] = useState({
    photo: null,
    rg_front: null,
    rg_back: null
  });

  const [previews, setPreviews] = useState({
    photo: null,
    rg_front: null,
    rg_back: null
  });

  const [loading, setLoading] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Gerar senha aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    return password;
  };

  // Buscar endereço por CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCEP(false);
    }
  };

  // Máscaras
  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const maskPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  // Handle file upload
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande! Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    setFiles(prev => ({ ...prev, [fieldName]: file }));

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.full_name || !formData.cpf || !formData.email || !formData.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.cargo) {
      toast.error('Selecione o tipo de colaborador');
      return;
    }

    if (!files.photo) {
      toast.error('Foto do colaborador é obrigatória');
      return;
    }

    if (!files.rg_front || !files.rg_back) {
      toast.error('RG/CNH (frente e verso) são obrigatórios');
      return;
    }

    // Gerar senha se ainda não foi gerada
    const password = generatedPassword || generatePassword();

    setLoading(true);

    try {
      // Criar FormData
      const formDataToSend = new FormData();
      
      // Adicionar campos de texto
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append('password', password);
      formDataToSend.append('must_change_password', 'true');
      
      // Adicionar arquivos
      formDataToSend.append('photo', files.photo);
      formDataToSend.append('rg_front', files.rg_front);
      formDataToSend.append('rg_back', files.rg_back);

      const response = await axios.post(
        `${API}/labelview/employees`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Colaborador cadastrado com sucesso!');
        toast.info(`Senha temporária: ${password}`, { duration: 10000 });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar colaborador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c]">
          <div className="flex items-center gap-3">
            <UserPlus size={32} />
            <div>
              <h2 className="text-2xl font-bold">Novo Colaborador</h2>
              <p className="text-sm opacity-90">Cadastro completo do colaborador</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Foto do Colaborador */}
          <div className="text-center">
            <Label className="block mb-2 text-lg font-semibold">Foto do Colaborador *</Label>
            <div className="flex justify-center">
              <div className="relative">
                {previews.photo ? (
                  <img
                    src={previews.photo}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#1a59ad]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <Camera size={40} className="text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'photo')}
                  className="hidden"
                />
                <label
                  htmlFor="photo"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700"
                >
                  <Upload size={16} />
                </label>
              </div>
            </div>
          </div>

          {/* ========== 1. DADOS PESSOAIS ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Nome completo do colaborador"
                  required
                />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              <div>
                <Label>WhatsApp *</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: maskPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>
            </div>
          </div>

          {/* ========== 2. ENDEREÇO ========== */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => {
                    const masked = maskCEP(e.target.value);
                    setFormData({...formData, cep: masked});
                    if (masked.replace(/\D/g, '').length === 8) {
                      buscarCEP(masked);
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCEP && <span className="text-xs text-blue-600">Buscando...</span>}
              </div>
              <div className="md:col-span-3">
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="Nº"
                />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={(e) => setFormData({...formData, complement: e.target.value})}
                  placeholder="Apto, Bloco..."
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* ========== 3. TIPO DE COLABORADOR ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-4 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Tipo de Colaborador *
            </h3>
            
            {/* Cards de Seleção de Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFormData({...formData, cargo: 'Financeiro'})}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  formData.cargo === 'Financeiro'
                    ? 'bg-[#1a59ad] border-[#2fa31c] text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-[#1a59ad] text-gray-700'
                }`}
              >
                <div className="text-3xl mb-2">💰</div>
                <div className="font-bold text-lg">Financeiro</div>
                <div className="text-sm mt-1 opacity-80">Gestão financeira</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, cargo: 'Comercial'})}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  formData.cargo === 'Comercial'
                    ? 'bg-[#1a59ad] border-[#2fa31c] text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-[#1a59ad] text-gray-700'
                }`}
              >
                <div className="text-3xl mb-2">💼</div>
                <div className="font-bold text-lg">Comercial</div>
                <div className="text-sm mt-1 opacity-80">Vendas e negócios</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, cargo: 'Operacional'})}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  formData.cargo === 'Operacional'
                    ? 'bg-[#1a59ad] border-[#2fa31c] text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-[#1a59ad] text-gray-700'
                }`}
              >
                <div className="text-3xl mb-2">⚙️</div>
                <div className="font-bold text-lg">Operacional</div>
                <div className="text-sm mt-1 opacity-80">Operações e logística</div>
              </button>
            </div>

            {/* Campos Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Regional</Label>
                <Input
                  value={formData.regional}
                  onChange={(e) => setFormData({...formData, regional: e.target.value})}
                  placeholder="Ex: Sul, Norte, Sudeste..."
                />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({...formData, commission_percentage: parseFloat(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ========== 4. DOCUMENTOS ========== */}
          <div className="border-t-4 border-[#2fa31c] pt-4">
            <h3 className="text-xl font-bold mb-2 text-[#2fa31c] flex items-center gap-2">
              <span className="bg-[#2fa31c] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Documentos (RG ou CNH) *
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              📄 Envie fotos nítidas do documento de identidade (RG) ou Carteira de Habilitação (CNH).
              Certifique-se de que todos os dados estejam legíveis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RG/CNH Frente */}
              <div>
                <Label className="text-base font-semibold mb-2 block">📸 Frente do Documento *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a59ad] transition-colors">
                  {previews.rg_front ? (
                    <div className="relative">
                      <img
                        src={previews.rg_front}
                        alt="RG Frente"
                        className="max-h-40 mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFiles(prev => ({...prev, rg_front: null}));
                          setPreviews(prev => ({...prev, rg_front: null}));
                        }}
                        className="absolute top-0 right-0 bg-[#1a59ad] text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="rg_front" className="cursor-pointer block">
                      <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">Clique para enviar a FRENTE</p>
                      <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                      <p className="text-xs text-gray-400 mt-2">Foto da parte da frente do documento com sua foto</p>
                    </label>
                  )}
                  <input
                    type="file"
                    id="rg_front"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'rg_front')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* RG/CNH Verso */}
              <div>
                <Label className="text-base font-semibold mb-2 block">📸 Verso do Documento *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#1a59ad] transition-colors">
                  {previews.rg_back ? (
                    <div className="relative">
                      <img
                        src={previews.rg_back}
                        alt="RG Verso"
                        className="max-h-40 mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFiles(prev => ({...prev, rg_back: null}));
                          setPreviews(prev => ({...prev, rg_back: null}));
                        }}
                        className="absolute top-0 right-0 bg-[#1a59ad] text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="rg_back" className="cursor-pointer block">
                      <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">Clique para enviar o VERSO</p>
                      <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                      <p className="text-xs text-gray-400 mt-2">Foto do verso do documento com dados complementares</p>
                    </label>
                  )}
                  <input
                    type="file"
                    id="rg_back"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'rg_back')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========== 5. DADOS DE LOGIN ========== */}
          <div className="border-t-4 border-[#1a59ad] pt-4">
            <h3 className="text-xl font-bold mb-2 text-[#1a59ad] flex items-center gap-2">
              <span className="bg-[#1a59ad] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Dados de Login
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              🔐 O colaborador usará estes dados para acessar o sistema.
            </p>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <Label>E-mail de Acesso *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este e-mail será usado para login no sistema
                </p>
              </div>

              {/* Senha Gerada */}
              <div className="bg-[#2fa31c]/10 border-2 border-[#2fa31c] rounded-lg p-4">
                <Label className="text-base font-semibold mb-2 block">Senha Temporária</Label>
                <p className="text-sm text-[#2fa31c] mb-3">
                  Uma senha será gerada automaticamente. O colaborador deverá alterá-la no primeiro acesso.
                </p>
                {generatedPassword ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedPassword}
                        readOnly
                        className="flex-1 font-mono bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          toast.success('Senha copiada!');
                        }}
                        title="Copiar senha"
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      ⚠️ Anote esta senha! Ela será necessária para o primeiro acesso do colaborador.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={generatePassword}
                    variant="outline"
                    className="w-full"
                  >
                    🔑 Gerar Senha Agora
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#1a59ad] hover:bg-[#2fa31c]">
              {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColaboradorFormModal;

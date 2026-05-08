import React, { useState, useEffect } from 'react';
import { X, Car, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Input = ({ className, style, ...props }) => (
  <input 
    style={{
      backgroundColor: '#e3dcda',
      color: '#1a59ad',
      border: '2px solid #1a59ad',
      borderRadius: '6px',
      padding: '8px 12px',
      ...style
    }}
    className={`w-full focus:outline-none focus:border-[#2fa31c] focus:bg-[#e3dcda] ${className || ''}`}
    {...props}
  />
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-[#1a59ad] mb-1">
    {children}
    {required && <span className="text-red-600 ml-1">*</span>}
  </label>
);

const TipoVeiculoModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(false);

  // 14 campos fixos para imagens de vistoria
  const camposVistoriaPadrao = [
    'Frente do veículo',
    'Traseira do veículo',
    'Lateral esquerda',
    'Lateral direita',
    'Painel frontal',
    'Hodômetro',
    'Motor',
    'Porta-malas',
    'Teto',
    'Rodas/Pneus',
    'Parte inferior',
    'Interior completo',
    'Documentos',
    'Chassi/Número de série'
  ];

  const [imagensVistoria, setImagensVistoria] = useState(
    camposVistoriaPadrao.map(nome => ({
      nome_campo: nome,
      imagem: null,
      preview: null
    }))
  );

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    is_active: true,
    valor_fipe_maximo: 120000,
    imagens_vistoria: []
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nome: editData.nome || '',
          categoria: editData.categoria || '',
          is_active: editData.is_active !== undefined ? editData.is_active : true,
          valor_fipe_maximo: editData.valor_fipe_maximo || 120000,
          imagens_vistoria: editData.imagens_vistoria || []
        });
        
        // Carregar imagens salvas ou usar campos padrão
        if (editData.imagens_vistoria && editData.imagens_vistoria.length > 0) {
          // Converter estrutura do banco {nome, url} para estrutura do componente {nome_campo, imagem, preview}
          const imagensConvertidas = editData.imagens_vistoria.map(img => ({
            nome_campo: img.nome || img.nome_campo || 'Imagem',
            imagem: img.url || img.imagem,
            preview: img.url || img.imagem || img.preview,
            cloudinary_id: img.cloudinary_id
          }));
          setImagensVistoria(imagensConvertidas);
        } else {
          setImagensVistoria(
            camposVistoriaPadrao.map(nome => ({
              nome_campo: nome,
              imagem: null,
              preview: null
            }))
          );
        }
      } else {
        setFormData({
          nome: '',
          categoria: '',
          is_active: true,
          valor_fipe_maximo: 120000,
          imagens_vistoria: []
        });
        setImagensVistoria(
          camposVistoriaPadrao.map(nome => ({
            nome_campo: nome,
            imagem: null,
            preview: null
          }))
        );
      }
    }
  }, [editData, isOpen]);
  
  // Cleanup quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      // Resetar imagens após um pequeno delay para evitar conflito com animações
      const timer = setTimeout(() => {
        setImagensVistoria(
          camposVistoriaPadrao.map(nome => ({
            nome_campo: nome,
            imagem: null,
            preview: null
          }))
        );
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Converter para número se o campo for numérico
    const finalValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleImageUpload = async (index, e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }

    // Mostrar preview imediatamente
    const reader = new FileReader();
    reader.onloadend = async () => {
      // Capturar nome do campo antes de atualizar estado
      const nomeCampoAtual = imagensVistoria[index].nome_campo;
      
      setImagensVistoria(prev => {
        const novasImagens = [...prev];
        novasImagens[index] = {
          ...novasImagens[index],
          preview: reader.result,
          uploading: true
        };
        return novasImagens;
      });
      
      // Fazer upload para Cloudinary
      try {
        toast.loading('Enviando imagem para Cloudinary...', { id: `upload-${index}` });
        
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('imagem_base64', reader.result);
        formData.append('nome_campo', nomeCampoAtual);
        formData.append('tipo_veiculo_id', editData?.id || 'temp');
        
        const response = await axios.post(
          `${API}/labelview/upload-imagem-tipo-veiculo`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        
        if (response.data.success) {
          setImagensVistoria(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              imagem: response.data.url,  // URL do Cloudinary
              preview: response.data.url,
              cloudinary_id: response.data.cloudinary_id,
              uploading: false
            };
            return updated;
          });
          
          toast.success('Imagem enviada para Cloudinary! ☁️', { id: `upload-${index}` });
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Erro ao enviar imagem', { id: `upload-${index}` });
        
        // Remover imagem em caso de erro
        setImagensVistoria(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            imagem: null,
            preview: null,
            uploading: false
          };
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
    
    // Limpar input
    e.target.value = '';
  };

  const handleRemoveImagem = (index) => {
    const novasImagens = [...imagensVistoria];
    novasImagens[index] = {
      ...novasImagens[index],
      imagem: null,
      preview: null
    };
    
    setImagensVistoria(novasImagens);
    setFormData(prev => ({
      ...prev,
      imagens_vistoria: novasImagens
    }));
    toast.success('Imagem removida');
  };

  const handleNomeCampoChange = (index, novoNome) => {
    const novasImagens = [...imagensVistoria];
    novasImagens[index] = {
      ...novasImagens[index],
      nome_campo: novoNome
    };
    setImagensVistoria(novasImagens);
    // Não precisa atualizar formData aqui, será feito no submit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Digite o nome do tipo de veículo');
      return;
    }

    if (!formData.categoria.trim()) {
      toast.error('Digite a categoria do veículo');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Converter imagensVistoria para o formato do backend {nome, url}
      const imagensParaSalvar = imagensVistoria
        .filter(img => img.imagem || img.preview) // Apenas imagens que foram adicionadas
        .map(img => ({
          nome: img.nome_campo,
          url: img.imagem || img.preview
        }));
      
      console.log(`📸 Enviando ${imagensParaSalvar.length} imagens para o backend`);
      
      // Converter is_active para ativo (backend espera "ativo")
      const dataToSend = {
        ...formData,
        ativo: formData.is_active,
        imagens_vistoria: imagensParaSalvar  // ADICIONAR AS IMAGENS!
      };
      delete dataToSend.is_active;
      
      console.log('📦 Dados a enviar:', {
        nome: dataToSend.nome,
        categoria: dataToSend.categoria,
        total_imagens: imagensParaSalvar.length
      });
      
      let response;
      if (editData) {
        // Editar
        console.log(`🔄 Enviando PATCH para: ${API}/labelview/tipos-veiculo/${editData.id}`);
        response = await axios.patch(`${API}/labelview/tipos-veiculo/${editData.id}`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ PATCH respondeu:', response.data);
      } else {
        // Criar novo
        console.log(`🔄 Enviando POST para: ${API}/labelview/tipos-veiculo`);
        response = await axios.post(`${API}/labelview/tipos-veiculo`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ POST respondeu:', response.data);
      }

      if (response.data.success) {
        console.log('✅ SUCESSO! Salvamento concluído');
        toast.success(editData ? 'Tipo de veículo atualizado com sucesso!' : 'Tipo de veículo cadastrado com sucesso!');
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        console.log('⚠️ Resposta sem success=true:', response.data);
        toast.warning('Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de veículo:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar tipo de veículo');
    } finally {
      setLoading(false);
    }
  };

  // Não renderizar se não estiver aberto ou se não tiver dados inicializados
  if (!isOpen || !imagensVistoria || imagensVistoria.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{`
        .tipo-veiculo-modal input[type="text"] {
          background-color: #e3dcda !important;
          color: #1a59ad !important;
          border: 2px solid #1a59ad !important;
        }
        .tipo-veiculo-modal input:focus {
          border-color: #2fa31c !important;
          background-color: #ffffff !important;
        }
        .tipo-veiculo-modal input::placeholder {
          color: #1a59ad !important;
          opacity: 0.6;
        }
      `}</style>
      <div className="tipo-veiculo-modal bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1a59ad] text-white p-6 flex items-center justify-between border-b-4 border-[#2fa31c] rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <Car size={28} />
            <div>
              <h2 className="text-xl font-bold">{editData ? 'Editar' : 'Novo'} Tipo de Veículo</h2>
              <p className="text-sm opacity-90">Cadastre tipos de veículos</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
          <div>
            <Label required>Nome do Tipo</Label>
            <Input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Carro, Moto, Caminhão"
              required
              maxLength={100}
            />
          </div>

          <div>
            <Label required>Categoria</Label>
            <Input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Ex: Passeio, Utilitário, Comercial"
              required
              maxLength={100}
            />
          </div>

          <div>
            <Label required>Valor Máximo FIPE para Cotação</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1a59ad] font-bold">R$</span>
              <Input
                type="number"
                name="valor_fipe_maximo"
                value={formData.valor_fipe_maximo}
                onChange={handleChange}
                placeholder="120000"
                required
                min="0"
                step="1000"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Veículos com valor FIPE acima deste limite serão bloqueados para cotação. Valor padrão: R$ 120.000,00
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a59ad] mb-1">Situação</label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#2fa31c] transition-colors">
                <input
                  type="radio"
                  name="is_active"
                  value="true"
                  checked={formData.is_active === true}
                  onChange={() => setFormData({...formData, is_active: true})}
                  className="w-5 h-5 text-[#2fa31c] border-[#1a59ad] focus:ring-[#2fa31c]"
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
                  className="w-5 h-5 text-red-600 border-[#1a59ad] focus:ring-red-600"
                />
                <span className="text-red-600 font-bold">Inativo</span>
              </label>
            </div>
          </div>

          {/* Banco de Imagens de Vistoria - Campos Opcionais */}
          <div className="border-t-2 border-[#2fa31c] pt-6 mt-6">
            <Label>Banco de Imagens para Vistoria (Opcional)</Label>
            <p className="text-xs text-[#1a59ad] mb-4">
              Configure os campos de vistoria com imagens de referência do MESMO VEÍCULO. Quantidade recomendada: Carros (14), Motos (9), Caminhões (11).
            </p>
            <p className="text-xs text-red-600 font-medium mb-2">
              ⚠️ IMPORTANTE: Use fotos do MESMO veículo em todas as posições!
            </p>
            <p className="text-xs text-[#2fa31c] font-medium mb-4">
              Formatos aceitos: JPG, PNG, GIF (máx 5MB por imagem)
            </p>

            {/* Grid de 14 Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {imagensVistoria.map((campo, index) => (
                <div key={`campo-vistoria-${index}`} className="border-2 border-[#1a59ad] rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  {/* Número e Nome do Campo */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-[#1a59ad] mb-1 block">
                      Campo {index + 1} - Nome do Campo:
                    </label>
                    <input
                      type="text"
                      value={campo.nome_campo}
                      onChange={(e) => handleNomeCampoChange(index, e.target.value)}
                      placeholder="Ex: Frente do veículo"
                      className="w-full px-3 py-2 text-sm border-2 border-[#1a59ad] rounded focus:border-[#2fa31c] focus:outline-none bg-[#e3dcda]"
                    />
                  </div>

                  {/* Preview da Imagem ou Área de Upload */}
                  {campo.preview ? (
                    <div className="relative">
                      <img
                        src={campo.preview}
                        alt={campo.nome_campo}
                        className="w-full h-40 object-cover rounded border-2 border-[#2fa31c]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImagem(index)}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-[#2fa31c] text-white text-xs px-2 py-1 rounded">
                        ✓ Imagem adicionada
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-[#1a59ad] rounded-lg h-40 flex flex-col items-center justify-center bg-[#e3dcda] hover:bg-white transition-colors">
                        <Upload size={32} className="text-[#1a59ad] mb-2" />
                        <span className="text-sm text-[#1a59ad] font-medium">Clique para adicionar</span>
                        <span className="text-xs text-[#1a59ad] mt-1">Imagem de referência</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>

            {/* Contador de Imagens */}
            <div className="mt-4 p-3 bg-[#e3dcda] rounded-lg border-l-4 border-[#2fa31c]">
              <p className="text-sm text-[#1a59ad]">
                <span className="font-bold text-[#2fa31c]">
                  {imagensVistoria.filter(img => img.imagem).length}
                </span>
                {' '}imagem(ns) adicionada(s) • Quantidade recomendada: Carros (14), Motos (9), Caminhões (11)
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t mt-6 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-[#1a59ad] rounded-lg hover:bg-white transition-colors"
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

export default TipoVeiculoModal;

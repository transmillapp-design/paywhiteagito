import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Palette,
  Users,
  Eye,
  Search,
  X,
  Check,
  Link2
} from 'lucide-react';

const FranquiasManager = () => {
  const { API, user } = useAuth();
  const [franquias, setFranquias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFranquia, setEditingFranquia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [franquiaParaVincular, setFranquiaParaVincular] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    estado: '',
    cidades: '',
    cor_primaria: '#1a59ad',
    cor_secundaria: '#ffffff',
    cor_texto: '#ffffff',
    email_contato: '',
    telefone_contato: ''
  });

  useEffect(() => {
    carregarFranquias();
  }, []);

  const carregarFranquias = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/franquias`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFranquias(response.data.franquias || []);
      }
    } catch (error) {
      console.error('Erro ao carregar white labels:', error);
      toast.error('Erro ao carregar white labels');
    } finally {
      setLoading(false);
    }
  };

  const carregarUnidadesDisponiveis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/labelview/unidades`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Filtrar unidades sem franquia ou da franquia atual
        const unidades = response.data.unidades?.filter(u => 
          !u.franquia_id || u.franquia_id === franquiaParaVincular?.id
        ) || [];
        setUnidadesDisponiveis(unidades);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        cidades: formData.cidades.split(',').map(c => c.trim()).filter(c => c)
      };

      if (editingFranquia) {
        // Atualizar
        const response = await axios.patch(
          `${API}/franquias/${editingFranquia.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success('White Label atualizado!');
          carregarFranquias();
          resetForm();
        } else {
          toast.error(response.data.error || 'Erro ao atualizar');
        }
      } else {
        // Criar
        const response = await axios.post(
          `${API}/franquias`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success('White Label criado com sucesso!');
          carregarFranquias();
          resetForm();
        } else {
          toast.error(response.data.error || 'Erro ao criar');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar white label:', error);
      toast.error('Erro ao salvar white label');
    }
  };

  const handleEdit = (franquia) => {
    setEditingFranquia(franquia);
    setFormData({
      nome: franquia.nome || '',
      slug: franquia.slug || '',
      estado: franquia.estado || '',
      cidades: (franquia.cidades || []).join(', '),
      cor_primaria: franquia.cor_primaria || '#1a59ad',
      cor_secundaria: franquia.cor_secundaria || '#ffffff',
      cor_texto: franquia.cor_texto || '#ffffff',
      email_contato: franquia.email_contato || '',
      telefone_contato: franquia.telefone_contato || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (franquiaId) => {
    if (!window.confirm('Deseja realmente desativar este white label?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/franquias/${franquiaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('White Label desativado');
        carregarFranquias();
      } else {
        toast.error(response.data.error || 'Erro ao desativar');
      }
    } catch (error) {
      console.error('Erro ao desativar white label:', error);
      toast.error('Erro ao desativar white label');
    }
  };

  const handleVincularUnidade = async (unidadeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/franquias/${franquiaParaVincular.id}/vincular-unidade`,
        { unidade_id: unidadeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Unidade vinculada!');
        carregarUnidadesDisponiveis();
        carregarFranquias();
      } else {
        toast.error(response.data.error || 'Erro ao vincular');
      }
    } catch (error) {
      console.error('Erro ao vincular unidade:', error);
      toast.error('Erro ao vincular unidade');
    }
  };

  const handleCriarDemo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/franquias/criar-demo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        carregarFranquias();
      } else {
        toast.error(response.data.error || 'Erro ao criar demo');
      }
    } catch (error) {
      console.error('Erro ao criar demo:', error);
      toast.error('Erro ao criar white label demo');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingFranquia(null);
    setFormData({
      nome: '',
      slug: '',
      estado: '',
      cidades: '',
      cor_primaria: '#1a59ad',
      cor_secundaria: '#ffffff',
      cor_texto: '#ffffff',
      email_contato: '',
      telefone_contato: ''
    });
  };

  const openVincularModal = (franquia) => {
    setFranquiaParaVincular(franquia);
    setShowVincularModal(true);
    carregarUnidadesDisponiveis();
  };

  const franquiasFiltradas = franquias.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.is_labelview_master && user?.user_type !== 'labelview_master') {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Acesso restrito ao Master.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#1a59ad]" />
            Gestão de White Labels
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie as franquias do sistema White Label
          </p>
        </div>
        <div className="flex gap-2">
          {franquias.length === 0 && (
            <Button
              onClick={handleCriarDemo}
              variant="outline"
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Criar Franquia Demo
            </Button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#1a59ad] hover:bg-[#134080] gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Franquia
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar white labels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total White Labels</p>
                <p className="text-2xl font-bold">{franquias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ativas</p>
                <p className="text-2xl font-bold">{franquias.filter(f => f.ativo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estados</p>
                <p className="text-2xl font-bold">
                  {new Set(franquias.map(f => f.estado)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidades</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Franquias */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#1a59ad] border-t-transparent rounded-full"></div>
        </div>
      ) : franquiasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum White Label encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em "Novo White Label" para criar o primeiro
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {franquiasFiltradas.map((franquia) => (
            <Card key={franquia.id} className="overflow-hidden">
              <div 
                className="h-2" 
                style={{ backgroundColor: franquia.cor_primaria || '#1a59ad' }}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {franquia.nome}
                      {franquia.is_demo && (
                        <Badge variant="secondary" className="text-xs">Demo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {franquia.estado} - {(franquia.cidades || []).join(', ')}
                    </CardDescription>
                  </div>
                  <Badge variant={franquia.ativo ? 'default' : 'secondary'}>
                    {franquia.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Slug:</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                    /franquia/{franquia.slug}
                  </code>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Cores:</span>
                  <div className="flex gap-1">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: franquia.cor_primaria }}
                      title="Cor Primária"
                    />
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: franquia.cor_secundaria }}
                      title="Cor Secundária"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(franquia)}
                    className="flex-1 gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openVincularModal(franquia)}
                    className="flex-1 gap-1"
                  >
                    <Link2 className="h-3 w-3" />
                    Unidades
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/franquia/${franquia.slug}`, '_blank')}
                    className="gap-1"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar Franquia */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingFranquia ? 'Editar White Label' : 'Novo White Label'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do White Label *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Ex: Transmill São Paulo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})}
                      placeholder="Ex: sp"
                      required
                      disabled={editingFranquia}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                      placeholder="Ex: SP"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidades">Cidades (separadas por vírgula)</Label>
                    <Input
                      id="cidades"
                      value={formData.cidades}
                      onChange={(e) => setFormData({...formData, cidades: e.target.value})}
                      placeholder="Ex: São Paulo, Campinas"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cores da Franquia
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Primária</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={formData.cor_primaria}
                          onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.cor_primaria}
                          onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Secundária</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={formData.cor_secundaria}
                          onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.cor_secundaria}
                          onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Texto</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={formData.cor_texto}
                          onChange={(e) => setFormData({...formData, cor_texto: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.cor_texto}
                          onChange={(e) => setFormData({...formData, cor_texto: e.target.value})}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contato</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email_contato}
                      onChange={(e) => setFormData({...formData, email_contato: e.target.value})}
                      placeholder="contato@franquia.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone_contato}
                      onChange={(e) => setFormData({...formData, telefone_contato: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: formData.cor_primaria }}>
                  <p className="text-sm font-medium" style={{ color: formData.cor_texto }}>
                    Preview: {formData.nome || 'Nome do White Label'}
                  </p>
                  <p className="text-xs opacity-80" style={{ color: formData.cor_texto }}>
                    /franquia/{formData.slug || 'slug'}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-[#1a59ad]">
                    {editingFranquia ? 'Salvar Alterações' : 'Criar White Label'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Vincular Unidades */}
      {showVincularModal && franquiaParaVincular && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Unidades - {franquiaParaVincular.nome}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowVincularModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Vincule unidades a esta franquia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unidadesDisponiveis.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma unidade disponível para vincular
                </p>
              ) : (
                <div className="space-y-2">
                  {unidadesDisponiveis.map((unidade) => (
                    <div
                      key={unidade.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{unidade.nome_fantasia || unidade.full_name}</p>
                        <p className="text-sm text-gray-500">{unidade.email}</p>
                      </div>
                      {unidade.franquia_id === franquiaParaVincular.id ? (
                        <Badge variant="secondary">Vinculada</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleVincularUnidade(unidade.id)}
                        >
                          Vincular
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FranquiasManager;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Users, UserPlus, Edit2, Trash2, Power, 
  Eye, EyeOff, Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const TeamManagement = () => {
  const { user, API, token } = useAuth();
  const [members, setMembers] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    permissions: []
  });

  useEffect(() => {
    fetchMembers();
    fetchAvailablePermissions();
  }, []);

  const fetchAvailablePermissions = async () => {
    try {
      const response = await axios.get(`${API}/merchant/team/available-permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailablePermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/merchant/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      toast.error('Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      await axios.post(
        `${API}/merchant/team`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Membro adicionado com sucesso!');
      setDialogOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        permissions: []
      });
      fetchMembers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.detail || 'Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) return;

    try {
      setLoading(true);
      
      await axios.put(
        `${API}/merchant/team/${selectedMember.id}`,
        {
          full_name: formData.full_name,
          phone: formData.phone,
          permissions: formData.permissions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Membro atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (memberId) => {
    try {
      const response = await axios.patch(
        `${API}/merchant/team/${memberId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      fetchMembers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (memberId, memberName) => {
    if (!window.confirm(`Deseja realmente remover ${memberName} da equipe?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/merchant/team/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Membro removido com sucesso');
      fetchMembers();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const openEditDialog = (member) => {
    setSelectedMember(member);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      password: '',
      permissions: member.permissions || []
    });
    setEditDialogOpen(true);
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Gestão de Equipe
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie as permissões de cada membro da sua equipe
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData({
              full_name: '',
              email: '',
              phone: '',
              password: '',
              permissions: []
            });
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Membro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Membros</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.is_active).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {members.filter(m => !m.is_active).length}
                </p>
              </div>
              <Power className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            {members.length === 0 ? 'Nenhum membro cadastrado ainda' : `${members.length} membro(s) cadastrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Sua equipe ainda está vazia</p>
              <Button 
                onClick={() => setDialogOpen(true)}
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex flex-col gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{member.full_name}</h3>
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <span>📧 {member.email}</span>
                        <span>📱 {member.phone}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(member)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(member.id)}
                        title={member.is_active ? "Desativar" : "Ativar"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(member.id, member.full_name)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Permissões */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Permissões:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.permissions && member.permissions.length > 0 ? (
                        member.permissions.map(perm => {
                          const permInfo = availablePermissions.find(p => p.id === perm);
                          return (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {permInfo?.label || perm}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500">Nenhuma permissão</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Novo Membro
            </DialogTitle>
            <DialogDescription>
              Preencha os dados e selecione as permissões do novo membro
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="joao@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">Permissões * (selecione pelo menos uma)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded">
                {availablePermissions.map((permission) => (
                  <div 
                    key={permission.id}
                    className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => togglePermission(permission.id)}
                  >
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{permission.label}</Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {formData.permissions.length > 0 && (
                <p className="text-sm text-green-600">
                  ✓ {formData.permissions.length} permissão(ões) selecionada(s)
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar Membro'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Membro
            </DialogTitle>
            <DialogDescription>
              Atualize os dados e permissões do membro
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Telefone *</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">O email não pode ser alterado</p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">Permissões * (selecione pelo menos uma)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded">
                {availablePermissions.map((permission) => (
                  <div 
                    key={permission.id}
                    className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => togglePermission(permission.id)}
                  >
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <Label className="font-medium cursor-pointer">{permission.label}</Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {formData.permissions.length > 0 && (
                <p className="text-sm text-green-600">
                  ✓ {formData.permissions.length} permissão(ões) selecionada(s)
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;

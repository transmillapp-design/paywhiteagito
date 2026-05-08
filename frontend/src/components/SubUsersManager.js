import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  UserCog,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const SubUsersManager = () => {
  const { API } = useAuth();
  const [subusers, setSubusers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [subuserForm, setSubuserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'vendedor',
    is_active: true,
    permissions: {
      can_create_sales: false,
      can_view_sales: false,
      can_cancel_sales: false,
      can_view_balance: false,
      can_make_withdrawals: false,
      can_view_transactions: false,
      can_manage_products: false,
      can_manage_services: false,
      can_view_customers: false,
      can_manage_customers: false,
      can_view_reports: false,
      can_export_data: false,
      can_manage_settings: false,
      can_manage_subusers: false
    }
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSubusers();
  }, []);

  const fetchSubusers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/subusers`, { headers });
      if (response.data.success) {
        setSubusers(response.data.subusers);
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'vendedor', label: 'Vendedor', description: 'Pode criar vendas e ver clientes', icon: '🛒' },
    { value: 'gerente', label: 'Gerente', description: 'Acesso amplo exceto finanças críticas', icon: '👔' },
    { value: 'financeiro', label: 'Financeiro', description: 'Acesso a relatórios e transações', icon: '💰' },
    { value: 'admin', label: 'Administrador', description: 'Acesso total', icon: '👑' },
    { value: 'custom', label: 'Personalizado', description: 'Definir permissões manualmente', icon: '⚙️' }
  ];

  const handleRoleChange = (role) => {
    let newPermissions = {...subuserForm.permissions};
    
    // Definir permissões baseadas no role
    if (role === 'vendedor') {
      newPermissions = {
        can_create_sales: true,
        can_view_sales: true,
        can_view_customers: true,
        can_view_balance: true,
        can_cancel_sales: false,
        can_make_withdrawals: false,
        can_view_transactions: false,
        can_manage_products: false,
        can_manage_services: false,
        can_manage_customers: false,
        can_view_reports: false,
        can_export_data: false,
        can_manage_settings: false,
        can_manage_subusers: false
      };
    } else if (role === 'gerente') {
      newPermissions = {
        can_create_sales: true,
        can_view_sales: true,
        can_cancel_sales: true,
        can_view_balance: true,
        can_view_transactions: true,
        can_manage_products: true,
        can_manage_services: true,
        can_view_customers: true,
        can_manage_customers: true,
        can_view_reports: true,
        can_export_data: true,
        can_make_withdrawals: false,
        can_manage_settings: false,
        can_manage_subusers: false
      };
    } else if (role === 'financeiro') {
      newPermissions = {
        can_view_balance: true,
        can_make_withdrawals: true,
        can_view_transactions: true,
        can_view_sales: true,
        can_view_reports: true,
        can_export_data: true,
        can_create_sales: false,
        can_cancel_sales: false,
        can_manage_products: false,
        can_manage_services: false,
        can_view_customers: false,
        can_manage_customers: false,
        can_manage_settings: false,
        can_manage_subusers: false
      };
    } else if (role === 'admin') {
      newPermissions = {
        can_create_sales: true,
        can_view_sales: true,
        can_cancel_sales: true,
        can_view_balance: true,
        can_make_withdrawals: true,
        can_view_transactions: true,
        can_manage_products: true,
        can_manage_services: true,
        can_view_customers: true,
        can_manage_customers: true,
        can_view_reports: true,
        can_export_data: true,
        can_manage_settings: true,
        can_manage_subusers: true
      };
    }
    
    setSubuserForm({...subuserForm, role, permissions: newPermissions});
    setShowPermissions(role === 'custom');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!subuserForm.full_name || !subuserForm.email || !subuserForm.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!editingUser && !subuserForm.password) {
      toast.error('A senha é obrigatória');
      return;
    }

    if (subuserForm.password && subuserForm.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    try {
      const userData = {
        full_name: subuserForm.full_name,
        email: subuserForm.email,
        phone: subuserForm.phone,
        password: subuserForm.password,
        role: subuserForm.role,
        permissions: subuserForm.role === 'custom' ? subuserForm.permissions : undefined,
        is_active: subuserForm.is_active
      };

      if (editingUser) {
        delete userData.email; // Não permitir alterar email
        if (!userData.password) delete userData.password; // Se não preencheu, não altera
        
        const response = await axios.put(
          `${API}/subusers/${editingUser.id}`,
          userData,
          { headers }
        );
        
        if (response.data.success) {
          toast.success('Colaborador atualizado com sucesso!');
          setEditingUser(null);
        }
      } else {
        const response = await axios.post(
          `${API}/subusers`,
          userData,
          { headers }
        );
        
        if (response.data.success) {
          toast.success('Colaborador criado com sucesso!');
        }
      }
      
      resetForm();
      setIsCreating(false);
      fetchSubusers();
      
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar colaborador');
    }
  };

  const handleEdit = (subuser) => {
    setEditingUser(subuser);
    setSubuserForm({
      full_name: subuser.full_name,
      email: subuser.email,
      phone: subuser.phone,
      password: '',
      role: subuser.role,
      is_active: subuser.is_active,
      permissions: subuser.permissions || {}
    });
    setShowPermissions(subuser.role === 'custom');
    setIsCreating(true);
  };

  const handleDelete = async (subuserId, subuserName) => {
    if (!window.confirm(`Tem certeza que deseja remover o colaborador ${subuserName}?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API}/subusers/${subuserId}`,
        { headers }
      );
      
      if (response.data.success) {
        toast.success('Colaborador removido com sucesso!');
        fetchSubusers();
      }
    } catch (error) {
      console.error('Erro ao deletar colaborador:', error);
      toast.error('Erro ao remover colaborador');
    }
  };

  const resetForm = () => {
    setSubuserForm({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'vendedor',
      is_active: true,
      permissions: {
        can_create_sales: false,
        can_view_sales: false,
        can_cancel_sales: false,
        can_view_balance: false,
        can_make_withdrawals: false,
        can_view_transactions: false,
        can_manage_products: false,
        can_manage_services: false,
        can_view_customers: false,
        can_manage_customers: false,
        can_view_reports: false,
        can_export_data: false,
        can_manage_settings: false,
        can_manage_subusers: false
      }
    });
    setEditingUser(null);
    setShowPermissions(false);
    setShowPassword(false);
  };

  const getPermissionsList = (permissions) => {
    const perms = [];
    if (permissions.can_create_sales) perms.push('Criar vendas');
    if (permissions.can_view_sales) perms.push('Ver vendas');
    if (permissions.can_view_balance) perms.push('Ver saldo');
    if (permissions.can_make_withdrawals) perms.push('Fazer saques');
    return perms;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2" />
                Gerenciar Colaboradores
              </CardTitle>
              <CardDescription>
                Crie usuários com permissões específicas para acessar áreas da sua conta
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setIsCreating(!isCreating);
                if (isCreating) resetForm();
              }}
              variant={isCreating ? "outline" : "default"}
            >
              {isCreating ? (
                <>
                  <X className="mr-2" size={16} />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="mr-2" size={16} />
                  Novo Colaborador
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-lg">
                {editingUser ? '✏️ Editar Colaborador' : '➕ Novo Colaborador'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={subuserForm.full_name}
                    onChange={(e) => setSubuserForm({...subuserForm, full_name: e.target.value})}
                    placeholder="João Silva"
                    required
                  />
                </div>
                
                <div>
                  <Label>Email * {editingUser && '(não pode ser alterado)'}</Label>
                  <Input
                    type="email"
                    value={subuserForm.email}
                    onChange={(e) => setSubuserForm({...subuserForm, email: e.target.value})}
                    placeholder="joao@exemplo.com"
                    required
                    disabled={!!editingUser}
                    className={editingUser ? 'bg-gray-200 cursor-not-allowed' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Telefone/WhatsApp *</Label>
                  <Input
                    value={subuserForm.phone}
                    onChange={(e) => setSubuserForm({...subuserForm, phone: e.target.value})}
                    placeholder="(11) 98765-4321"
                    required
                  />
                </div>

                <div>
                  <Label>{editingUser ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha *'}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={subuserForm.password}
                      onChange={(e) => setSubuserForm({...subuserForm, password: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      required={!editingUser}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Função/Cargo *</Label>
                <Select value={subuserForm.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showPermissions && (
                <div className="border p-4 rounded-lg space-y-3 bg-white">
                  <h4 className="font-semibold text-sm mb-3 flex items-center">
                    ⚙️ Permissões Personalizadas
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Vendas */}
                    <div className="space-y-2 border-l-2 border-blue-500 pl-3">
                      <p className="text-xs font-semibold text-blue-600">🛒 Vendas</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_create_sales}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_create_sales: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Criar vendas</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_view_sales}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_view_sales: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Ver vendas</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_cancel_sales}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_cancel_sales: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Cancelar vendas</span>
                      </label>
                    </div>

                    {/* Financeiro */}
                    <div className="space-y-2 border-l-2 border-green-500 pl-3">
                      <p className="text-xs font-semibold text-green-600">💰 Financeiro</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_view_balance}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_view_balance: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Ver saldo</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_make_withdrawals}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_make_withdrawals: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Fazer saques</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_view_transactions}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_view_transactions: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Ver transações</span>
                      </label>
                    </div>

                    {/* Produtos/Serviços */}
                    <div className="space-y-2 border-l-2 border-purple-500 pl-3">
                      <p className="text-xs font-semibold text-purple-600">📦 Produtos/Serviços</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_manage_products}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_manage_products: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Gerenciar produtos</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_manage_services}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_manage_services: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Gerenciar serviços</span>
                      </label>
                    </div>

                    {/* Clientes */}
                    <div className="space-y-2 border-l-2 border-orange-500 pl-3">
                      <p className="text-xs font-semibold text-orange-600">👥 Clientes</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_view_customers}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_view_customers: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Ver clientes</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_manage_customers}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_manage_customers: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Gerenciar clientes</span>
                      </label>
                    </div>

                    {/* Relatórios */}
                    <div className="space-y-2 border-l-2 border-cyan-500 pl-3">
                      <p className="text-xs font-semibold text-cyan-600">📊 Relatórios</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_view_reports}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_view_reports: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Ver relatórios</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_export_data}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_export_data: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Exportar dados</span>
                      </label>
                    </div>

                    {/* Administração */}
                    <div className="space-y-2 border-l-2 border-red-500 pl-3">
                      <p className="text-xs font-semibold text-red-600">⚡ Administração</p>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_manage_settings}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_manage_settings: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Gerenciar configurações</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subuserForm.permissions.can_manage_subusers}
                          onChange={(e) => setSubuserForm({
                            ...subuserForm,
                            permissions: {...subuserForm.permissions, can_manage_subusers: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <span>Gerenciar colaboradores</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={subuserForm.is_active}
                  onChange={(e) => setSubuserForm({...subuserForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  ✅ Colaborador Ativo (pode fazer login)
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  <Save className="mr-2" size={16} />
                  {editingUser ? 'Atualizar' : 'Criar'} Colaborador
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsCreating(false);
                  }}
                >
                  <X className="mr-2" size={16} />
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando colaboradores...</p>
            </div>
          ) : subusers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCog size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum colaborador cadastrado
              </h3>
              <p className="text-sm mb-4">
                Crie colaboradores para delegar tarefas e controlar acessos
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2" size={16} />
                Criar Primeiro Colaborador
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {subusers.map((subuser) => (
                <Card key={subuser.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-full text-white font-bold text-lg">
                          {subuser.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg">{subuser.full_name}</h3>
                            <Badge variant={subuser.is_active ? "default" : "secondary"}>
                              {subuser.is_active ? '✅ Ativo' : '❌ Inativo'}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50">
                              {roleOptions.find(r => r.value === subuser.role)?.icon} {roleOptions.find(r => r.value === subuser.role)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">📧 {subuser.email}</p>
                          <p className="text-sm text-gray-600">📱 {subuser.phone}</p>
                          
                          {subuser.last_login && (
                            <p className="text-xs text-gray-500 mt-2">
                              🕐 Último acesso: {new Date(subuser.last_login).toLocaleString('pt-BR')}
                            </p>
                          )}
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Permissões principais:</p>
                            <div className="flex flex-wrap gap-1">
                              {getPermissionsList(subuser.permissions).slice(0, 4).map((perm, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-green-50">
                                  {perm}
                                </Badge>
                              ))}
                              {getPermissionsList(subuser.permissions).length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{getPermissionsList(subuser.permissions).length - 4} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(subuser)}
                        >
                          <Edit size={14} className="mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(subuser.id, subuser.full_name)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre o sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-3">ℹ️ Como funciona?</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div>• <strong>Colaboradores</strong> têm acesso limitado conforme as permissões</div>
            <div>• Cada colaborador faz login com seu próprio email e senha</div>
            <div>• Você pode ativar/desativar colaboradores a qualquer momento</div>
            <div>• As ações dos colaboradores ficam registradas no sistema</div>
            <div>• <strong>Vendedor</strong>: Ideal para funcionários que fazem vendas</div>
            <div>• <strong>Gerente</strong>: Acesso amplo para gerenciar operações</div>
            <div>• <strong>Financeiro</strong>: Controle de caixa e transações</div>
            <div>• <strong>Admin</strong>: Acesso total (exceto deletar conta principal)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubUsersManager;

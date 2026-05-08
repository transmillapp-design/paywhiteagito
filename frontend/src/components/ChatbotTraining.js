import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Bot, Plus, Edit, Trash2, Save, X, ArrowRight, AlertCircle, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import axios from 'axios';

const ChatbotTraining = ({ API, token }) => {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    keywords: '',
    response: '',
    action_type: 'navigate',
    action_target: '',
    action_label: 'Ir para esta área',
    priority: 0
  });

  // Áreas disponíveis na plataforma
  const platformAreas = [
    { id: 'deposito', name: 'Depósito', path: '/deposito', icon: '💰', description: 'Área de depósito de valores' },
    { id: 'sacar', name: 'Saque', path: '/sacar', icon: '💵', description: 'Área de saque/retirada' },
    { id: 'indicar', name: 'Indicar Amigos', path: '/indicar', icon: '🎁', description: 'Sistema de indicação' },
    { id: 'extrato', name: 'Extrato', path: '/extrato', icon: '📊', description: 'Histórico de transações' },
    { id: 'usdt', name: 'USDT/Cripto', path: '/usdt', icon: '₿', description: 'Gestão de criptomoedas' },
    { id: 'internet', name: 'Internet Móvel', path: '/internet-movel', icon: '📱', description: 'Planos de internet' },
    { id: 'lojas', name: 'Lojas', path: '/lojas', icon: '🏪', description: 'Marketplace de lojas' },
    { id: 'prestadores', name: 'Prestadores', path: '/prestadores', icon: '🔧', description: 'Serviços profissionais' },
    { id: 'telemedicina', name: 'Telemedicina', path: '/telemedicina', icon: '⚕️', description: 'Consultas médicas online' },
    { id: 'payment', name: 'Pagar', path: '/payment', icon: '💳', description: 'Efetuar pagamentos' },
    { id: 'pos', name: 'POS/Vendas', path: '/pos', icon: '🛒', description: 'Sistema de vendas' },
    { id: 'profile', name: 'Perfil', path: '/profile', icon: '👤', description: 'Perfil do usuário' },
    { id: 'vendas', name: 'Minhas Vendas', path: '/vendas', icon: '📈', description: 'Histórico de vendas' },
    { id: 'mobilidade', name: 'Mobilidade', path: 'EXTERNAL:mobility', icon: '🚗', description: 'App Transmill Moby (transporte)' },
    { id: 'protecao', name: 'Proteção Veicular', path: 'EXTERNAL:https://transmill.com.br', icon: '🛡️', description: 'Seguros e proteção para veículos' },
    { id: 'eventos', name: 'Eventos', path: 'EXTERNAL:https://agitoticket.com.br', icon: '🎉', description: 'Ingressos e experiências' }
  ];

  // Carregar comandos
  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/master/chatbot/commands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCommands(response.data.commands);
      }
    } catch (error) {
      console.error('Erro ao carregar comandos:', error);
      toast.error('Erro ao carregar comandos do chatbot');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!formData.keywords.trim()) {
      toast.error('Adicione pelo menos uma palavra-chave');
      return;
    }
    if (!formData.response.trim()) {
      toast.error('Digite a resposta do chatbot');
      return;
    }
    
    try {
      // Converter keywords string para array
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const payload = {
        ...formData,
        keywords: keywordsArray,
        priority: parseInt(formData.priority) || 0
      };
      
      if (editing) {
        // Atualizar
        await axios.put(`${API}/master/chatbot/commands/${editing}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Comando atualizado com sucesso!');
      } else {
        // Criar
        await axios.post(`${API}/master/chatbot/commands`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Comando criado com sucesso!');
      }
      
      // Resetar form e recarregar
      resetForm();
      fetchCommands();
    } catch (error) {
      console.error('Erro ao salvar comando:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar comando');
    }
  };

  const handleEdit = (command) => {
    setEditing(command.id);
    setFormData({
      keywords: command.keywords.join(', '),
      response: command.response,
      action_type: command.action_type || 'navigate',
      action_target: command.action_target || '',
      action_label: command.action_label || 'Ir para esta área',
      priority: command.priority || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (commandId) => {
    if (!window.confirm('Tem certeza que deseja deletar este comando?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/master/chatbot/commands/${commandId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comando deletado com sucesso!');
      fetchCommands();
    } catch (error) {
      console.error('Erro ao deletar comando:', error);
      toast.error('Erro ao deletar comando');
    }
  };

  const handleToggleActive = async (command) => {
    try {
      await axios.put(`${API}/master/chatbot/commands/${command.id}`, 
        { is_active: !command.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(command.is_active ? 'Comando desativado' : 'Comando ativado');
      fetchCommands();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do comando');
    }
  };

  const resetForm = () => {
    setFormData({
      keywords: '',
      response: '',
      action_type: 'navigate',
      action_target: '',
      action_label: 'Ir para esta área',
      priority: 0
    });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Bot className="mr-3 text-purple-600" size={28} />
            <span>Treinamento do Assistente IA Interno</span>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Configure respostas automáticas para o campo "O que você precisa hoje?" no dashboard dos usuários
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Exemplo de Uso */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900 text-lg">
            <Sparkles className="mr-2 text-blue-600" size={20} />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Exemplo:</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong className="text-blue-700">Usuário digita:</strong> "deposito" ou "quero depositar"
              </p>
              <p>
                <strong className="text-green-700">Bot responde:</strong> "Ótimo! Vou chamar aqui nossa área de depósito. 
                Lembrando que você pode depositar em PIX BRL ou PIX USDT"
              </p>
              <p>
                <strong className="text-purple-700">Ação:</strong> Botão "Ir para Depósito" que redireciona para /deposit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Adicionar */}
      {!showForm && (
        <Button 
          onClick={() => setShowForm(true)} 
          className="w-full btn-primary"
          size="lg"
        >
          <Plus size={20} />
          <span>Adicionar Novo Comando</span>
        </Button>
      )}

      {/* Formulário */}
      {showForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center text-green-900">
                {editing ? <Edit size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                {editing ? 'Editar Comando' : 'Novo Comando'}
              </span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X size={20} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Keywords */}
              <div>
                <Label htmlFor="keywords">
                  Palavras-chave (separadas por vírgula) *
                </Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="Ex: deposito, depositar, colocar dinheiro"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Digite palavras que o usuário pode usar. Quanto mais variações, melhor!
                </p>
              </div>

              {/* Response */}
              <div>
                <Label htmlFor="response">Resposta do Bot *</Label>
                <textarea
                  id="response"
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  placeholder="Ex: Ótimo! Vou chamar aqui nossa área de depósito. Lembrando que você pode depositar em PIX BRL ou PIX USDT"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Action Type */}
              <div>
                <Label htmlFor="action_type">Tipo de Ação</Label>
                <Select 
                  value={formData.action_type}
                  onValueChange={(value) => setFormData({ ...formData, action_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="navigate">Navegar para uma página</SelectItem>
                    <SelectItem value="none">Sem ação (apenas resposta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selecionar Área da Plataforma */}
              {formData.action_type === 'navigate' && (
                <div>
                  <Label className="mb-3 block">
                    Selecione a Área da Plataforma *
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {platformAreas.map((area) => (
                      <div
                        key={area.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            action_target: area.path,
                            action_label: `Ir para ${area.name}`
                          });
                        }}
                        className={`
                          flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${formData.action_target === area.path 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-white'
                          }
                        `}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`
                            w-6 h-6 rounded border-2 flex items-center justify-center
                            ${formData.action_target === area.path 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'bg-white border-gray-300'
                            }
                          `}>
                            {formData.action_target === area.path && (
                              <CheckCircle size={18} className="text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{area.icon}</span>
                            <span className="font-semibold text-sm text-gray-800">
                              {area.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{area.description}</p>
                          <p className="text-xs text-blue-600 mt-1 font-mono">{area.path}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.action_target && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <strong>Área selecionada:</strong> {platformAreas.find(a => a.path === formData.action_target)?.name}
                    </div>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Comandos com maior prioridade aparecem primeiro em caso de múltiplos matches
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  <Save size={18} />
                  <span>{editing ? 'Atualizar' : 'Criar'} Comando</span>
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Comandos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare className="mr-2" size={20} />
              Comandos Configurados ({commands.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : commands.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Bot size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Nenhum comando configurado ainda</p>
              <p className="text-sm text-gray-500 mt-1">Clique em "Adicionar Novo Comando" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commands.map((command) => (
                <Card key={command.id} className={`${command.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {command.is_active ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle size={12} className="mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              <AlertCircle size={12} className="mr-1" />
                              Inativo
                            </Badge>
                          )}
                          {command.priority > 0 && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              Prioridade: {command.priority}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Keywords */}
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Palavras-chave:</p>
                          <div className="flex flex-wrap gap-1">
                            {command.keywords.map((kw, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Response */}
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Resposta:</p>
                          <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">
                            {command.response}
                          </p>
                        </div>

                        {/* Action */}
                        {command.action_type === 'navigate' && command.action_target && (
                          <div className="flex items-center text-xs text-purple-700 bg-purple-50 p-2 rounded">
                            <ArrowRight size={14} className="mr-1" />
                            <span className="font-semibold mr-2">{command.action_label}</span>
                            <span className="text-purple-600">→ {command.action_target}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(command)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleActive(command)}
                          className={command.is_active ? "text-orange-600 border-orange-200" : "text-green-600 border-green-200"}
                        >
                          {command.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(command.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
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
    </div>
  );
};

export default ChatbotTraining;

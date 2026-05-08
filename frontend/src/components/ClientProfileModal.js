import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Save, Lock } from 'lucide-react';
import CompleteUserProfile from './CompleteUserProfile';
import { toast } from 'sonner';

const ClientProfileModal = ({ isOpen, onClose, user }) => {
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    email: user?.email || '',
    pix_type: user?.pix_type || 'cpf',
    pix_key: user?.pix_key || '',
    cep: user?.address?.zipcode || '',
    street: user?.address?.street || '',
    number: user?.address?.number || '',
    complement: user?.address?.complement || '',
    neighborhood: user?.address?.neighborhood || '',
    city: user?.address?.city || '',
    state: user?.address?.state || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grid 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="w-24 h-24 mb-2">
                      <AvatarImage src={user?.profile_image} />
                      <AvatarFallback className="bg-blue-600 text-white text-2xl">
                        {user?.full_name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" size="sm">
                      <Camera className="mr-2" size={14} />
                      Alterar Foto
                    </Button>
                  </div>

                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label>CPF *</Label>
                    <Input
                      value={user?.cpf || user?.document || user?.cnpj || 'Não informado'}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este campo não pode ser alterado</p>
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={profileForm.whatsapp}
                        onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                  </div>

                  {/* Dados PIX */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Dados PIX para Saque</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo da Chave PIX</Label>
                        <Input
                          value={profileForm.pix_type}
                          onChange={(e) => setProfileForm({...profileForm, pix_type: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Chave PIX</Label>
                        <Input
                          value={profileForm.pix_key}
                          onChange={(e) => setProfileForm({...profileForm, pix_key: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Endereço</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="CEP"
                        value={profileForm.cep}
                        onChange={(e) => setProfileForm({...profileForm, cep: e.target.value})}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Rua"
                          className="col-span-2"
                          value={profileForm.street}
                          onChange={(e) => setProfileForm({...profileForm, street: e.target.value})}
                        />
                        <Input
                          placeholder="Número"
                          value={profileForm.number}
                          onChange={(e) => setProfileForm({...profileForm, number: e.target.value})}
                        />
                      </div>
                      <Input
                        placeholder="Complemento"
                        value={profileForm.complement}
                        onChange={(e) => setProfileForm({...profileForm, complement: e.target.value})}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Bairro"
                          value={profileForm.neighborhood}
                          onChange={(e) => setProfileForm({...profileForm, neighborhood: e.target.value})}
                        />
                        <Input
                          placeholder="Cidade"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                        />
                        <Input
                          placeholder="UF"
                          value={profileForm.state}
                          onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="mr-2" size={16} />
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Card 2: Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label>Senha Atual *</Label>
                    <Input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                      placeholder="Digite sua senha atual"
                    />
                  </div>

                  <div>
                    <Label>Nova Senha *</Label>
                    <Input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <Label>Confirmar Nova Senha *</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      placeholder="Digite a senha novamente"
                    />
                  </div>

                  <Button type="submit" className="w-full" variant="secondary">
                    <Lock className="mr-2" size={16} />
                    Atualizar Senha
                  </Button>
                </form>

                {/* Dica de Segurança */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Dica de Segurança</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use senhas fortes e únicas</li>
                    <li>• Não compartilhe sua senha</li>
                    <li>• Altere sua senha regularmente</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Documentos */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <CompleteUserProfile />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;

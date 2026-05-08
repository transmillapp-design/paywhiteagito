import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  User, Car, Shield, Camera, FileText, Check, Calendar, 
  DollarSign, MapPin, Phone, Mail, CreditCard, Download, Clock
} from 'lucide-react';

const ResumoProtecaoCompleto = ({
  clienteData,
  veiculoData,
  planoSelecionado,
  complementosSelecionados,
  coberturasData,
  fotosVistoria,
  condutorData,
  assinaturaBase64,
  valorPlano,
  valorComplementos,
  taxaAdesao,
  onFinalizar,
  onVoltar,
  loading
}) => {
  const [diaVencimento, setDiaVencimento] = useState(10);
  
  // Calcular valores
  const taxaRastreador = 50.00; // Taxa fixa obrigatória
  const valorMensal = valorPlano + valorComplementos + taxaRastreador;
  const valorPrimeiroMes = valorMensal + taxaAdesao;
  const vigenciaMeses = planoSelecionado?.vigencia_meses || 12;
  
  // Data da primeira parcela
  const hoje = new Date();
  const primeiraParcela = new Date(hoje);
  primeiraParcela.setMonth(primeiraParcela.getMonth() + 1);
  primeiraParcela.setDate(diaVencimento);
  
  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  
  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header do Resumo */}
      <Card className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark text-white">
        <CardContent className="p-6 text-center">
          <Check className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Resumo da Contratação</h2>
          <p className="text-white/90">Revise todos os dados antes de finalizar</p>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User size={20} className="text-transmill-olive" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome Completo</p>
              <p className="font-semibold">{clienteData.nome || condutorData.nomeCondutor}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CPF</p>
              <p className="font-semibold">{clienteData.cpf || condutorData.cpfCondutor}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <Mail size={14} className="inline mr-1" />
                E-mail
              </p>
              <p className="font-semibold">{clienteData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <Phone size={14} className="inline mr-1" />
                Telefone
              </p>
              <p className="font-semibold">{clienteData.telefone || condutorData.telefone}</p>
            </div>
          </div>
          
          {condutorData.cep && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                <MapPin size={14} className="inline mr-1" />
                Endereço
              </p>
              <p className="font-semibold">
                {condutorData.street}, {condutorData.number}
                {condutorData.complement && ` - ${condutorData.complement}`}
              </p>
              <p className="text-sm text-gray-600">
                {condutorData.neighborhood} - {condutorData.city}/{condutorData.state}
              </p>
              <p className="text-sm text-gray-600">CEP: {condutorData.cep}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados do Veículo */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car size={20} className="text-transmill-olive" />
            Dados do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo de Veículo</p>
              <p className="font-semibold">{veiculoData.tipo_veiculo_nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Marca/Modelo</p>
              <p className="font-semibold">{veiculoData.marca} {veiculoData.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ano</p>
              <p className="font-semibold">{veiculoData.ano}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Placa</p>
              <p className="font-semibold">{veiculoData.placa}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor FIPE</p>
              <p className="font-semibold text-transmill-olive">{formatarMoeda(Number(veiculoData.valorFipe))}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano e Coberturas */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield size={20} className="text-transmill-olive" />
            Plano Contratado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Plano Principal */}
          <div className="bg-transmill-gold/10 p-4 rounded-lg border border-transmill-gold">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-lg text-transmill-olive">{planoSelecionado?.nome_plano}</p>
                <p className="text-sm text-gray-600">{planoSelecionado?.descricao}</p>
                <Badge className="mt-2 bg-transmill-olive text-white">
                  Vigência: {vigenciaMeses} meses
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#2fa31c]">{formatarMoeda(valorPlano)}</p>
                <p className="text-xs text-gray-500">por mês</p>
              </div>
            </div>
            
            {/* Coberturas */}
            <div className="mt-3 pt-3 border-t border-transmill-gold/30">
              <p className="text-sm font-semibold text-gray-700 mb-2">Coberturas Incluídas:</p>
              <div className="grid grid-cols-2 gap-2">
                {coberturasData.rouboFurto && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Roubo/Furto</span>
                  </div>
                )}
                {coberturasData.colisao && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Colisão</span>
                  </div>
                )}
                {coberturasData.vidros && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Vidros</span>
                  </div>
                )}
                {coberturasData.assistencia24h && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Assistência 24h</span>
                  </div>
                )}
                {coberturasData.carroReserva && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Carro Reserva</span>
                  </div>
                )}
                {coberturasData.danosTerceiros && (
                  <div className="flex items-center gap-1 text-sm">
                    <Check size={14} className="text-green-600" />
                    <span>Danos a Terceiros</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complementos */}
          {complementosSelecionados.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-gray-700 mb-2">Complementos Selecionados</p>
              <div className="space-y-2">
                {complementosSelecionados.map((comp, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{comp.nome}</p>
                      <p className="text-xs text-gray-600">{comp.descricao}</p>
                    </div>
                    <p className="font-bold text-blue-600">+ {formatarMoeda(comp.valor)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vistoria */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera size={20} className="text-transmill-olive" />
            Vistoria do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check size={20} className="text-green-600" />
            <p className="font-semibold text-green-600">Vistoria Concluída</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {fotosVistoria.frente && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Camera size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Frente</p>
              </div>
            )}
            {fotosVistoria.traseira && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Camera size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Traseira</p>
              </div>
            )}
            {fotosVistoria.lateralEsquerda && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Camera size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Lateral Esq.</p>
              </div>
            )}
            {fotosVistoria.lateralDireita && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Camera size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Lateral Dir.</p>
              </div>
            )}
            {fotosVistoria.painel && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Camera size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Painel</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contrato e Assinatura */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText size={20} className="text-transmill-olive" />
            Contrato e Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check size={20} className="text-green-600" />
            <p className="font-semibold text-green-600">Contrato Assinado Digitalmente</p>
          </div>
          {assinaturaBase64 && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Assinatura Digital</p>
              <img 
                src={assinaturaBase64} 
                alt="Assinatura" 
                className="h-24 border border-gray-300 rounded bg-white mx-auto"
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Assinado em {formatarData(hoje)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valores e Vencimento */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign size={20} className="text-transmill-olive" />
            Valores e Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Composição do Valor */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Valor do Plano (mensal)</span>
              <span className="font-semibold">{formatarMoeda(valorPlano)}</span>
            </div>
            {complementosSelecionados.length > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Complementos (mensal)</span>
                <span className="font-semibold">{formatarMoeda(valorComplementos)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded">
              <span className="text-gray-700 font-medium">Taxa de Rastreador (mensal)</span>
              <span className="font-semibold text-blue-600">{formatarMoeda(taxaRastreador)}</span>
            </div>
            {taxaAdesao > 0 && (
              <div className="flex justify-between items-center py-2 text-orange-600">
                <span>Taxa de Adesão (única)</span>
                <span className="font-semibold">{formatarMoeda(taxaAdesao)}</span>
              </div>
            )}
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">Valor Mensal</span>
                <span className="font-bold text-xl text-[#2fa31c]">{formatarMoeda(valorMensal)}</span>
              </div>
              {taxaAdesao > 0 && (
                <div className="flex justify-between items-center text-orange-600">
                  <span className="font-semibold">Primeira Parcela (com taxa de adesão)</span>
                  <span className="font-bold text-lg">{formatarMoeda(valorPrimeiroMes)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Escolha do Dia de Vencimento */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block mb-2">
              <Calendar size={16} className="inline mr-2" />
              <span className="font-semibold text-gray-700">Escolha o dia de vencimento:</span>
            </label>
            <select 
              value={diaVencimento} 
              onChange={(e) => setDiaVencimento(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transmill-olive"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia}>Dia {dia}</option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-2">
              <Clock size={12} className="inline mr-1" />
              Primeira parcela: {formatarData(primeiraParcela)}
            </p>
          </div>

          {/* Resumo das Parcelas */}
          <div className="bg-gradient-to-r from-transmill-olive to-transmill-olive-dark p-6 rounded-lg text-white">
            <h4 className="font-bold text-lg mb-4">Resumo das Parcelas</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>1ª Parcela (com taxa)</span>
                <span className="font-bold">{formatarMoeda(valorPrimeiroMes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Parcelas 2 a {vigenciaMeses}</span>
                <span className="font-bold">{formatarMoeda(valorMensal)}</span>
              </div>
              <div className="border-t border-white/30 pt-2 mt-2 flex justify-between items-center">
                <span>Vigência Total</span>
                <span className="font-bold">{vigenciaMeses} meses</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Vencimento</span>
                <span className="font-bold">Todo dia {diaVencimento}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Finais */}
      <div className="flex gap-4 justify-center sticky bottom-4">
        <Button
          variant="outline"
          onClick={onVoltar}
          disabled={loading}
          className="border-gray-300"
        >
          Voltar e Revisar
        </Button>
        <Button
          onClick={() => onFinalizar(diaVencimento)}
          disabled={loading}
          className="bg-transmill-olive hover:bg-transmill-olive-dark text-white px-8"
        >
          {loading ? (
            <>
              <Clock className="animate-spin mr-2" size={20} />
              Finalizando...
            </>
          ) : (
            <>
              <Check className="mr-2" size={20} />
              Finalizar Contratação
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ResumoProtecaoCompleto;

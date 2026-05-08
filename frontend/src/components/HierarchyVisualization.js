import React from 'react';
import { Shield, Building2, Map, Users, User, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const HierarchyVisualization = () => {
  return (
    <Card className="shadow-lg border-2 border-[#1a59ad]">
      <CardHeader className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Shield size={32} />
          Hierarquia do Sistema Labelview
        </CardTitle>
        <p className="text-sm text-white/90 mt-2">
          📊 Estrutura de acesso e visualização de dados (Visível apenas pelo Master)
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Nível 1: Master */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-[#1a59ad] to-[#2fa31c] text-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={28} />
                <div>
                  <h3 className="text-xl font-bold">NÍVEL 1: MASTER LABELVIEW</h3>
                  <p className="text-sm opacity-90">Acesso TOTAL ao sistema</p>
                </div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <Eye size={20} className="inline mr-2" />
                <span className="font-semibold">VÊ TUDO</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center my-2">
            <ChevronDown size={32} className="text-[#1a59ad]" />
          </div>
        </div>

        {/* Nível 2: Unidade */}
        <div className="mb-6 ml-8">
          <div className="bg-[#1a59ad] text-white p-4 rounded-lg shadow-md border-l-4 border-[#2fa31c]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 size={24} />
                <div>
                  <h3 className="text-lg font-bold">NÍVEL 2: UNIDADE (Franquia)</h3>
                  <p className="text-sm opacity-90">Acesso a tudo abaixo da Unidade</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded text-sm">
                <Eye size={16} className="inline mr-1" />
                Regionais + Consultores
              </div>
            </div>
            
            <div className="mt-3 bg-white/10 p-3 rounded">
              <p className="text-sm font-semibold mb-2">📝 Cadastra:</p>
              <ul className="text-xs space-y-1">
                <li>• Regionais (Mini Agências)</li>
                <li>• Consultores</li>
                <li>• Clientes</li>
              </ul>
              <p className="text-sm font-semibold mt-2 mb-2">👁️ Visualiza:</p>
              <ul className="text-xs space-y-1">
                <li>• TODOS os dados dos Regionais</li>
                <li>• TODOS os dados dos Consultores</li>
                <li>• TODOS os clientes (próprios + Regional + Consultores)</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center my-2">
            <ChevronDown size={28} className="text-[#2fa31c]" />
          </div>
        </div>

        {/* Nível 3: Regional */}
        <div className="mb-6 ml-16">
          <div className="bg-[#2fa31c] text-white p-4 rounded-lg shadow-md border-l-4 border-[#1a59ad]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Map size={24} />
                <div>
                  <h3 className="text-lg font-bold">NÍVEL 3: REGIONAL (Mini Agência)</h3>
                  <p className="text-sm opacity-90">Divisão geográfica/operacional</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded text-sm">
                <Eye size={16} className="inline mr-1" />
                Seus dados + Consultores
              </div>
            </div>
            
            <div className="mt-3 bg-white/10 p-3 rounded">
              <p className="text-sm font-semibold mb-2">📝 Cadastra:</p>
              <ul className="text-xs space-y-1">
                <li>• Consultores</li>
                <li>• Clientes</li>
              </ul>
              <p className="text-sm font-semibold mt-2 mb-2">👁️ Visualiza:</p>
              <ul className="text-xs space-y-1">
                <li>• TUDO que cadastrou diretamente</li>
                <li>• TODOS os dados dos SEUS Consultores</li>
                <li>• TODOS os clientes dos Consultores</li>
              </ul>
              <p className="text-sm font-semibold mt-2 mb-1">⚠️ Importante:</p>
              <ul className="text-xs space-y-1">
                <li>• Dados visíveis pela Unidade (superior)</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center my-2">
            <ChevronDown size={28} className="text-[#1a59ad]" />
          </div>
        </div>

        {/* Nível 4: Consultor */}
        <div className="ml-32">
          <div className="bg-[#2fa31c] text-white p-3 rounded-lg shadow border-l-4 border-[#1a59ad]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} />
                <div>
                  <h3 className="text-base font-bold">NÍVEL 4: CONSULTOR</h3>
                  <p className="text-xs opacity-90">Profissional de vendas na Regional</p>
                </div>
              </div>
              <div className="bg-white/20 px-2 py-1 rounded text-xs">
                <Eye size={14} className="inline mr-1" />
                Apenas seus clientes
              </div>
            </div>
            
            <div className="mt-2 bg-white/10 p-2 rounded">
              <p className="text-xs font-semibold mb-1">📝 Cadastra:</p>
              <ul className="text-xs space-y-1">
                <li>• Clientes (apenas os seus)</li>
              </ul>
              <p className="text-xs font-semibold mt-2 mb-1">👁️ Visualiza:</p>
              <ul className="text-xs space-y-1">
                <li>• APENAS seus próprios clientes</li>
                <li>• Suas comissões</li>
                <li>• Suas vendas</li>
              </ul>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <EyeOff size={14} />
                <span>NÃO vê clientes de outros Consultores</span>
              </div>
              <p className="text-xs font-semibold mt-2 mb-1">⚠️ Visibilidade:</p>
              <ul className="text-xs space-y-1">
                <li>• Clientes visíveis pela Regional</li>
                <li>• Clientes visíveis pela Unidade</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resumo de Regras */}
        <div className="mt-8 p-4 bg-[#e3dcda] rounded-lg border-2 border-[#1a59ad]">
          <h4 className="text-lg font-bold text-[#1a59ad] mb-3 flex items-center gap-2">
            <Shield size={20} />
            Regras de Acesso e Visibilidade
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border-l-4 border-[#2fa31c]">
              <h5 className="font-semibold text-sm text-[#2fa31c] mb-2">✅ Transparência Vertical</h5>
              <ul className="text-xs space-y-1 text-gray-700">
                <li>• Master vê TUDO</li>
                <li>• Unidade vê tudo dos Regionais e Consultores</li>
                <li>• Regional vê tudo dos seus Consultores</li>
                <li>• Consultor vê apenas seus clientes</li>
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded border-l-4 border-[#1a59ad]">
              <h5 className="font-semibold text-sm text-[#1a59ad] mb-2">❌ Isolamento Horizontal</h5>
              <ul className="text-xs space-y-1 text-gray-700">
                <li>• Unidade X não vê Unidade Y</li>
                <li>• Regional A não vê Regional B</li>
                <li>• Consultor A não vê clientes de Consultor B</li>
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded border-l-4 border-[#2fa31c]">
              <h5 className="font-semibold text-sm text-[#2fa31c] mb-2">📝 Quem Cadastra O Quê</h5>
              <ul className="text-xs space-y-1 text-gray-700">
                <li>• <strong>Master:</strong> Unidades + Colaboradores (internos)</li>
                <li>• <strong>Unidade:</strong> Regionais + Consultores + Clientes</li>
                <li>• <strong>Regional:</strong> Consultores + Clientes</li>
                <li>• <strong>Consultor:</strong> Clientes (apenas)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-[#1a59ad]/10 to-[#2fa31c]/10 rounded border border-[#1a59ad]">
            <p className="text-sm font-semibold text-[#1a59ad] mb-2">
              📊 Fluxo de Dados Exemplo:
            </p>
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-mono bg-white p-2 rounded">
                Consultor cadastra Cliente → Visível para: Consultor + Regional + Unidade + Master
              </p>
              <p className="font-mono bg-white p-2 rounded">
                Regional cadastra Cliente → Visível para: Regional + Unidade + Master
              </p>
              <p className="font-mono bg-white p-2 rounded">
                Unidade cadastra Cliente → Visível para: Unidade + Master
              </p>
            </div>
          </div>

          {/* Colaboradores Internos do Master */}
          <div className="mt-4 p-4 bg-[#1a59ad]/10 rounded-lg border-2 border-[#1a59ad]">
            <h4 className="text-base font-bold text-[#1a59ad] mb-3 flex items-center gap-2">
              <User size={20} />
              👔 Colaboradores (Funcionários Internos do Master)
            </h4>
            <div className="text-xs text-gray-700 space-y-2">
              <p className="font-semibold">⚠️ IMPORTANTE: Colaboradores NÃO fazem parte da hierarquia de franquias!</p>
              <ul className="space-y-1 ml-4">
                <li>• São <strong>funcionários INTERNOS</strong> do Master Labelview</li>
                <li>• Tipos: 💰 Financeiro, 💼 Comercial, ⚙️ Operacional</li>
                <li>• Têm acesso ao sistema Master conforme classificação</li>
                <li>• NÃO gerenciam Unidades, Regionais ou Consultores</li>
              </ul>
              <div className="mt-2 p-2 bg-white rounded">
                <p className="font-semibold">Diferença:</p>
                <p>• <strong>Colaboradores:</strong> Equipe fixa interna do Master</p>
                <p>• <strong>Consultores:</strong> Rede externa de vendas nas Regionais</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>⚠️ Esta visualização é exclusiva do Master e não aparece para outros níveis</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HierarchyVisualization;

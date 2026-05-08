import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Car, MapPin, Clock, Star, Shield } from 'lucide-react';

// Página de exemplo para demonstrar integração com parceiros
const ServiceLandingExample = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-bold text-gray-800">Transmill Mobilidade</h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Partner
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-blue-100" />
            <h2 className="text-2xl font-bold mb-2">Mobilidade Urbana</h2>
            <p className="text-blue-100 mb-4">
              Transporte rápido, seguro e com cashback em Transmill
            </p>
            <Badge className="bg-white/20 text-white">
              🎁 Até 5% de cashback
            </Badge>
          </CardContent>
        </Card>

        {/* Service Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Escolha seu transporte</h3>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Carro Executivo</h4>
                <p className="text-sm text-gray-500">Conforto e rapidez</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">R$ 12,50</p>
                <p className="text-xs text-gray-500">8 min</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Car className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Carro Econômico</h4>
                <p className="text-sm text-gray-500">Melhor custo-benefício</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">R$ 8,90</p>
                <p className="text-xs text-gray-500">12 min</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Car className="text-orange-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Moto Express</h4>
                <p className="text-sm text-gray-500">Mais rápido na cidade</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">R$ 6,50</p>
                <p className="text-xs text-gray-500">5 min</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin size={18} />
              <span>Definir trajeto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">De onde?</label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-800">Sua localização atual</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Para onde?</label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <input 
                  type="text" 
                  placeholder="Digite o destino..."
                  className="flex-1 bg-transparent border-none outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <Shield className="mr-2" size={18} />
              Vantagens Transmill
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Cashback de até 5% em Transmill</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Pagamento direto com saldo da carteira</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Conversão automática BRL ↔ USDT</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Histórico integrado no seu dashboard</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-lg font-semibold">
          Chamar Agora 🚗
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Parceiro oficial Transmill</p>
          <p>Segurança e qualidade garantidas</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceLandingExample;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, ShoppingBag, Users, Gift, DollarSign, 
  Smartphone, Store, Wrench, TrendingUp, Zap,
  ArrowRight, Check, Sparkles, Crown, Target
} from 'lucide-react';

const PromoLandingPage = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Todas as funcionalidades do Transmill
  const features = [
    {
      icon: Gift,
      title: 'Cashback até 15%',
      description: 'Ganhe de volta em cada compra',
      color: 'from-green-500 to-emerald-600',
      highlight: true
    },
    {
      icon: Users,
      title: 'Indique e Ganhe',
      description: 'Renda extra com indicações',
      color: 'from-purple-500 to-pink-600',
      highlight: true
    },
    {
      icon: Store,
      title: 'Lojas Parceiras',
      description: 'Marketplace completo',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Wrench,
      title: 'Prestadores',
      description: 'Serviços profissionais',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Smartphone,
      title: 'Internet Móvel',
      description: 'Recarga com cashback',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'USDT/Cripto',
      description: 'Conversão instantânea',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: DollarSign,
      title: 'PIX Grátis',
      description: 'Saque e depósito rápido',
      color: 'from-teal-500 to-green-600'
    },
    {
      icon: Wallet,
      title: 'Carteira Digital',
      description: 'Seu dinheiro seguro',
      color: 'from-gray-700 to-gray-900'
    }
  ];

  const benefits = [
    'Cadastro 100% grátis',
    'Cashback automático em todas as compras',
    'Ganhe indicando amigos',
    'Saque quando quiser via PIX',
    'Plataforma segura e regulada'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Impacto Máximo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Background Pattern - Decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-6 py-2 mb-8 shadow-lg animate-bounce">
            <Sparkles size={20} />
            <span className="font-bold">Novidade no Brasil</span>
          </div>

          {/* Main Headline - Chamada de Impacto */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span className="block text-gray-900">Ganhe dinheiro</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              comprando e indicando
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-medium">
            A plataforma que te dá <span className="font-bold text-green-600">cashback em todas as compras</span> e <span className="font-bold text-purple-600">renda com indicações</span>
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={() => navigate('/register')}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-3 w-full sm:w-auto justify-center"
            >
              <span>Começar Agora Grátis</span>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Check className="text-green-600" size={20} />
              <span>Sem mensalidade</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="text-green-600" size={20} />
              <span>Cadastro em 2 minutos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="text-green-600" size={20} />
              <span>10 mil+ usuários</span>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2 mx-auto">
              <div className="w-1 h-3 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona - Benefícios Principais */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Como você ganha dinheiro?
            </h2>
            <p className="text-xl text-gray-600">
              Duas formas simples de aumentar sua renda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Cashback */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 sm:p-12 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Gift className="text-white" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Cashback até 15%
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Receba de volta parte do valor em <span className="font-bold">todas as suas compras</span> no marketplace. Quanto mais você compra, mais você ganha!
              </p>
              <div className="bg-white rounded-xl p-4 border-2 border-green-300">
                <p className="text-sm text-gray-600">Exemplo:</p>
                <p className="text-2xl font-bold text-green-600">
                  Comprou R$ 100 → Ganhou R$ 15
                </p>
              </div>
            </div>

            {/* Indicação */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 sm:p-12 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Indique e Ganhe
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Compartilhe seu código e <span className="font-bold">ganhe comissões</span> toda vez que seus indicados comprarem ou indicarem outras pessoas!
              </p>
              <div className="bg-white rounded-xl p-4 border-2 border-purple-300">
                <p className="text-sm text-gray-600">Sua rede cresce:</p>
                <p className="text-2xl font-bold text-purple-600">
                  Você + Indicados = Renda passiva
                </p>
              </div>
            </div>
          </div>

          {/* CTA Secundário */}
          <div className="text-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 hover:shadow-xl transition-all inline-flex items-center space-x-2"
            >
              <span>Quero ganhar dinheiro agora</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Todas as Funcionalidades */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Tudo em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              8 funcionalidades poderosas na palma da sua mão
            </p>
          </div>

          {/* Grid de Funcionalidades */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`bg-white rounded-2xl p-6 text-center hover:shadow-2xl transition-all duration-300 cursor-pointer group ${
                  feature.highlight ? 'ring-2 ring-green-400' : ''
                } ${hoveredFeature === index ? 'scale-105' : ''}`}
              >
                {feature.highlight && (
                  <div className="mb-2">
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                      DESTAQUE
                    </span>
                  </div>
                )}
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que Transmill */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Por que escolher Transmill?
            </h2>
          </div>

          <div className="space-y-4 mb-12">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center space-x-4 bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
                <p className="text-lg font-medium text-gray-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Urgência */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white rounded-full px-6 py-2 mb-8">
            <Crown size={20} />
            <span className="font-bold">Oferta Limitada</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Comece a ganhar hoje mesmo
          </h2>
          
          <p className="text-xl sm:text-2xl text-white/90 mb-12 font-medium">
            Junte-se a milhares de pessoas que já estão ganhando dinheiro com Transmill
          </p>

          <button
            onClick={() => navigate('/register')}
            className="group px-12 py-6 bg-white text-purple-600 rounded-full font-black text-xl hover:bg-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center space-x-3"
          >
            <span>Criar Minha Conta Grátis</span>
            <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>

          <p className="mt-8 text-white/80 text-sm">
            Sem cartão de crédito • Sem taxas • Sem complicação
          </p>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/transmill-icon.svg" 
              alt="Transmill" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold">Transmill</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Transmill. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PromoLandingPage;

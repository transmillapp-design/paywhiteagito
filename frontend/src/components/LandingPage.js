import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, ShoppingBag, Users, TrendingUp, Shield, Zap, 
  Globe, Smartphone, ArrowRight, Check, Star, Award,
  Gift, Percent, DollarSign, CreditCard, Store, Heart
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Wallet,
      title: 'Carteira Digital',
      description: 'Gerencie seu dinheiro em BRL e criptomoedas em um só lugar',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace Integrado',
      description: 'Compre produtos e serviços com cashback automático',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Gift,
      title: 'Cashback até 15%',
      description: 'Receba de volta parte do valor em cada compra realizada',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Sistema de Indicação',
      description: 'Ganhe comissões indicando amigos e construa sua rede',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: TrendingUp,
      title: 'Exchange de Cripto',
      description: 'Converta entre BRL e USDT com taxas competitivas',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Store,
      title: 'Para Lojistas',
      description: 'Venda seus produtos online com gestão completa',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  const benefits = [
    'Sem mensalidade ou taxas escondidas',
    'Cashback automático em todas as compras',
    'Conversão de moedas instantânea',
    'Sistema de indicação multinível',
    'Plataforma 100% segura e regulada',
    'App mobile para iOS e Android'
  ];

  const stats = [
    { value: '10k+', label: 'Usuários Ativos' },
    { value: 'R$ 2M+', label: 'Transacionado' },
    { value: '15%', label: 'Cashback Máximo' },
    { value: '24/7', label: 'Suporte' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transmill
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:block px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md">
                <Star className="text-yellow-500" size={20} fill="currentColor" />
                <span className="text-sm font-medium">Plataforma #1 em Crescimento</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Seu dinheiro,
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  mais inteligente
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-600 leading-relaxed">
                A plataforma completa que une carteira digital, marketplace, 
                cashback e exchange de criptomoedas. Tudo em um só lugar.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Criar Conta Grátis</span>
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-gray-700 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200"
                >
                  Ver Funcionalidades
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Shield className="text-green-600" size={24} />
                  <span className="text-sm text-gray-600 font-medium">100% Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="text-[#005B9C]" size={24} />
                  <span className="text-sm text-gray-600 font-medium">Regulamentado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="text-red-600" size={24} />
                  <span className="text-sm text-gray-600 font-medium">10k+ Usuários</span>
                </div>
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className="relative">
              {/* Floating Cards */}
              <div className="relative h-[600px]">
                {/* Card 1 - Wallet */}
                <div className="absolute top-0 right-0 w-80 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white transform hover:scale-105 transition-all">
                  <Wallet size={48} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Saldo Disponível</h3>
                  <p className="text-4xl font-bold mb-4">R$ 5.432,00</p>
                  <div className="flex items-center justify-between text-sm opacity-90">
                    <span>USDT: $1,250.00</span>
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Card 2 - Cashback */}
                <div className="absolute bottom-20 left-0 w-72 bg-white rounded-3xl shadow-2xl p-6 transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Gift className="text-green-600" size={32} />
                    <span className="text-3xl font-bold text-green-600">+15%</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Cashback Recebido</h4>
                  <p className="text-2xl font-bold text-gray-900">R$ 543,20</p>
                  <p className="text-sm text-gray-600 mt-2">Este mês</p>
                </div>

                {/* Card 3 - Stats */}
                <div className="absolute bottom-0 right-20 w-64 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl p-6 text-white transform hover:scale-105 transition-all">
                  <Users size={32} className="mb-4" />
                  <h4 className="text-lg font-bold mb-2">Rede Ativa</h4>
                  <p className="text-3xl font-bold">127</p>
                  <p className="text-sm opacity-90 mt-2">Indicações diretas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                uma única plataforma
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubra como o Transmill revoluciona a forma de gerenciar seu dinheiro
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Benefits List */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Por que escolher o
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Transmill?
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Junte-se a milhares de pessoas que já transformaram a forma de lidar com dinheiro
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                      <Check className="text-green-600" size={16} />
                    </div>
                    <p className="text-lg text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - CTA Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Comece agora mesmo!</h3>
              <p className="text-lg mb-8 opacity-90">
                Cadastre-se gratuitamente e ganhe <span className="font-bold">R$ 50 de bônus</span> de boas-vindas
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Zap size={20} />
                  <span>Cadastro em menos de 2 minutos</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Shield size={20} />
                  <span>Verificação rápida e segura</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Gift size={20} />
                  <span>Bônus de boas-vindas garantido</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Criar Minha Conta Grátis
              </button>
              <p className="text-center text-sm mt-4 opacity-75">
                Já tem uma conta? <button onClick={() => navigate('/login')} className="underline font-semibold">Faça login</button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Pronto para transformar seu dinheiro?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Milhares de pessoas já estão aproveitando todas as vantagens. Não fique de fora!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-white text-purple-600 rounded-full font-bold text-xl hover:scale-110 transition-all duration-300 shadow-2xl inline-flex items-center space-x-3"
          >
            <span>Começar Agora</span>
            <ArrowRight size={24} />
          </button>
          <p className="mt-6 text-sm opacity-75">
            Sem compromisso. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Wallet className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold">Transmill</span>
              </div>
              <p className="text-gray-400 mb-4">
                A plataforma completa para gerenciar seu dinheiro digital
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Transmill. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

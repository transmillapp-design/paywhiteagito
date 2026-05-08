import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const USDTCalculator = ({ 
  amount = '', 
  onAmountChange, 
  showCalculation = true,
  maxAmount = 100000 
}) => {
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFee();
    } else {
      setCalculation(null);
      setError('');
    }
  }, [amount]);

  const calculateFee = async () => {
    try {
      setLoading(true);
      setError('');

      const amountValue = parseFloat(amount);
      
      if (amountValue > maxAmount) {
        setError(`Valor máximo por operação: R$ ${maxAmount.toLocaleString('pt-BR')}`);
        setCalculation(null);
        return;
      }

      if (amountValue < 10) {
        setError('Valor mínimo: R$ 10,00');
        setCalculation(null);
        return;
      }

      const response = await fetch(`${API_URL}/usdt/calculate-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount_brl: amountValue })
      });

      const data = await response.json();

      if (data.success) {
        setCalculation(data.data);
      } else {
        setError('Erro ao calcular taxa');
      }
    } catch (err) {
      console.error('Erro ao calcular taxa USDT:', err);
      setError('Erro ao calcular taxa');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatUSDT = (value) => {
    return `${value.toFixed(6)} USDT`;
  };

  return (
    <div className="space-y-4">
      {/* Input de valor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Valor do Depósito (BRL)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0,00"
            min="10"
            max={maxAmount}
            step="0.01"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        {/* Limite máximo */}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Limite máximo por operação: R$ {maxAmount.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Calculadora de taxas */}
      {showCalculation && amount && parseFloat(amount) > 0 && !error && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
            💰 Cálculo do Depósito USDT
          </h4>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Calculando...</p>
            </div>
          ) : calculation ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor solicitado:</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.amount_brl)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa conversão USDT:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(calculation.fee_amount)} ({calculation.fee_percentage}%)
                </span>
              </div>
              
              <hr className="border-blue-200 dark:border-blue-800" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Valor líquido:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(calculation.net_amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Equivalente USDT:</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatUSDT(calculation.net_usdt)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cotação USDT/BRL:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(calculation.usdt_rate)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default USDTCalculator;
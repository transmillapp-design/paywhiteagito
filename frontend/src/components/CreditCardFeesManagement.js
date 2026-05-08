import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { CreditCard, Save, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';

const CreditCardFeesManagement = () => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState({});
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/master/credit-card-fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFees(response.data.fees);
      }
    } catch (error) {
      console.error('Erro ao buscar taxas:', error);
      toast.error('Erro ao carregar taxas de cartão');
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = (installment, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    setFees(prev => ({
      ...prev,
      [`installment_${installment}`]: numValue
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate all fees
      for (let i = 1; i <= 12; i++) {
        const key = `installment_${i}`;
        if (fees[key] === undefined || fees[key] < 0) {
          toast.error(`Taxa para ${i}x é inválida`);
          return;
        }
      }
      
      const response = await axios.post(
        `${API}/master/credit-card-fees`,
        fees,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Taxas atualizadas com sucesso!');
        fetchFees();
      }
    } catch (error) {
      console.error('Erro ao salvar taxas:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar taxas');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Taxas de Cartão de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Taxas de Cartão de Crédito
        </CardTitle>
        <p className="text-sm text-gray-500 mt-2">
          Configure as taxas (%) para cada quantidade de parcelas. Estas taxas serão aplicadas 
          sobre o valor do depósito quando clientes escolherem pagar com cartão de crédito.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(installment => (
            <div key={installment} className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {installment}x Parcela{installment > 1 ? 's' : ''}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fees[`installment_${installment}`] || 0}
                  onChange={(e) => handleFeeChange(installment, e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            💡 <strong>Exemplo:</strong> Depósito de R$ 100,00 em 2x com taxa de {fees.installment_2 || 0}% = 
            R$ {(100 + (100 * (fees.installment_2 || 0) / 100)).toFixed(2)} total
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Taxas
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardFeesManagement;

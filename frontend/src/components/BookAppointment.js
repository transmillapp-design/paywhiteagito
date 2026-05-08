import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { Calendar, Clock, User, ArrowLeft, Check } from 'lucide-react';

const BookAppointment = ({ providerId, onBack }) => {
  const { user, API } = useAuth();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [clientNotes, setClientNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchAvailableSlots();
      fetchProviderServices();
    }
  }, [providerId]);

  const fetchAvailableSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API}/provider/${providerId}/available-slots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAvailableSlots(data.available_slots || []);
        setProvider(data.provider);
      } else {
        toast.error('Erro ao carregar horários disponíveis');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderServices = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API}/servicos?provider_id=${providerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      toast.error('Selecione um horário');
      return;
    }

    try {
      setBooking(true);
      const token = localStorage.getItem('token');
      
      const bookingData = {
        provider_id: providerId,
        service_id: selectedService?.id || null,
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        client_notes: clientNotes.trim() || null
      };

      const response = await fetch(`${API}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Agendamento solicitado com sucesso!');
        setSelectedSlot(null);
        setSelectedService(null);
        setClientNotes('');
        fetchAvailableSlots(); // Atualizar slots disponíveis
      } else {
        toast.error(data.detail || 'Erro ao agendar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao agendar');
    } finally {
      setBooking(false);
    }
  };

  const groupSlotsByDate = (slots) => {
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (dateString) => {
    return dateString === new Date().toISOString().split('T')[0];
  };

  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateString === tomorrow.toISOString().split('T')[0];
  };

  const formatDateHeader = (dateString) => {
    if (isToday(dateString)) return `Hoje - ${formatDate(dateString)}`;
    if (isTomorrow(dateString)) return `Amanhã - ${formatDate(dateString)}`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Carregando horários disponíveis...</p>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);
  const sortedDates = Object.keys(groupedSlots).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Agendar com {provider?.name}
                </CardTitle>
                {provider?.company_name && (
                  <p className="text-sm text-gray-600 mt-1">{provider.company_name}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Horários Disponíveis */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedDates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum horário disponível</p>
                    <p className="text-sm">Este prestador não possui horários disponíveis no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedDates.map(date => (
                      <div key={date} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-gray-700">
                          {formatDateHeader(date)}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {groupedSlots[date].map(slot => (
                            <Button
                              key={`${slot.date}_${slot.start_time}`}
                              variant={selectedSlot === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedSlot(slot)}
                              className={`${
                                selectedSlot === slot 
                                  ? "bg-indigo-600 text-white" 
                                  : "hover:bg-indigo-50"
                              }`}
                            >
                              {slot.start_time} - {slot.end_time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Agendamento */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Prestador */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Prestador</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{provider?.name}</span>
                  </div>
                </div>

                {/* Horário Selecionado */}
                {selectedSlot && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Horário Selecionado</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div className="text-sm">
                        <p>{formatDate(selectedSlot.date)}</p>
                        <p className="text-gray-600">{selectedSlot.start_time} - {selectedSlot.end_time}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Serviços Disponíveis */}
                {services.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Serviço (Opcional)</Label>
                    <div className="mt-2 space-y-2">
                      <Button
                        variant={selectedService === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedService(null)}
                        className="w-full justify-start text-left"
                      >
                        Não especificar serviço
                      </Button>
                      {services.map(service => (
                        <Button
                          key={service.id}
                          variant={selectedService?.id === service.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedService(service)}
                          className="w-full justify-between text-left"
                        >
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.estimated_duration}min</p>
                          </div>
                          <span className="text-sm font-medium">
                            R$ {service.price.toFixed(2)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Observações (Opcional)
                  </Label>
                  <textarea
                    id="notes"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows="3"
                    placeholder="Descreva detalhes do serviço ou preferências..."
                  />
                </div>

                {/* Botão Agendar */}
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot || booking}
                  className="w-full"
                >
                  {booking ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Agendando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Solicitar Agendamento
                    </div>
                  )}
                </Button>

                {selectedSlot && (
                  <div className="text-xs text-gray-500 mt-2">
                    <p><strong>Importante:</strong> Seu agendamento ficará pendente até ser confirmado pelo prestador.</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
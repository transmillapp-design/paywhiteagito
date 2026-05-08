import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { Calendar, Clock, Plus, Trash2, Check, X, User, Phone } from 'lucide-react';

const ProviderSchedule = () => {
  const { user, API } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    is_recurring: false
  });

  useEffect(() => {
    if (user?.user_type === 'service_provider') {
      fetchProviderAgenda();
    }
  }, [user]);

  const fetchProviderAgenda = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Buscar próximos 30 dias
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`${API}/provider/availability?start_date=${startDate}&end_date=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAvailabilitySlots(data.availability_slots || []);
        setAppointments(data.appointments || []);
      } else {
        toast.error('Erro ao carregar agenda');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
        toast.error('Preencha todos os campos');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/provider/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSlot)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Horário adicionado com sucesso!');
        setShowAddSlot(false);
        setNewSlot({ date: '', start_time: '', end_time: '', is_recurring: false });
        fetchProviderAgenda();
      } else {
        toast.error(data.detail || 'Erro ao adicionar horário');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao adicionar horário');
    }
  };

  const handleRemoveSlot = async (slotId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/provider/availability/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Horário removido com sucesso!');
        fetchProviderAgenda();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Erro ao remover horário');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao remover horário');
    }
  };

  const handleAppointmentStatus = async (appointmentId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/appointments/${appointmentId}/status?status=${status}&notes=${encodeURIComponent(notes)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'cancelado'}!`);
        fetchProviderAgenda();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Erro ao atualizar agendamento');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar agendamento');
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

  const groupAppointmentsByDate = (appointments) => {
    const grouped = {};
    appointments.forEach(apt => {
      if (!grouped[apt.appointment_date]) {
        grouped[apt.appointment_date] = [];
      }
      grouped[apt.appointment_date].push(apt);
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

  if (user?.user_type !== 'service_provider') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Esta página é apenas para prestadores de serviço.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Carregando agenda...</p>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availabilitySlots);
  const groupedAppointments = groupAppointmentsByDate(appointments);
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  return (
    <div className="min-h-screen bg-[#EEEEEE] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
              <p className="text-gray-600">Gerencie seus horários disponíveis e agendamentos</p>
            </div>
            <Button 
              onClick={() => setShowAddSlot(true)}
              className="bg-[#005B9C] hover:bg-[#005B9C]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Horário
            </Button>
          </div>
        </div>

        {/* Agendamentos Pendentes */}
        {pendingAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <Clock className="w-5 h-5 mr-2" />
                Agendamentos Pendentes ({pendingAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAppointments.map(apt => (
                  <div key={apt.id} className="border rounded-lg p-4 bg-amber-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1 text-gray-600" />
                            <span className="font-semibold">{apt.client_name}</span>
                          </div>
                          {apt.client_phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1 text-gray-600" />
                              <span className="text-sm text-gray-600">{apt.client_phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Data:</strong> {formatDate(apt.appointment_date)}</p>
                          <p><strong>Horário:</strong> {apt.start_time} - {apt.end_time}</p>
                          {apt.service_name && <p><strong>Serviço:</strong> {apt.service_name}</p>}
                          {apt.service_price && <p><strong>Valor:</strong> R$ {apt.service_price.toFixed(2)}</p>}
                          {apt.client_notes && <p><strong>Observações:</strong> {apt.client_notes}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleAppointmentStatus(apt.id, 'confirmed')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleAppointmentStatus(apt.id, 'cancelled')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal Adicionar Horário */}
        {showAddSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Adicionar Horário Disponível</h3>
              <div className="space-y-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newSlot.is_recurring}
                    onChange={(e) => setNewSlot({...newSlot, is_recurring: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="recurring">Repetir semanalmente</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddSlot(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSlot}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Agenda - Horários Disponíveis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disponibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#005B9C]" />
                Horários Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedSlots).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum horário disponível</p>
                  <p className="text-sm">Adicione horários para receber agendamentos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSlots)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, slots]) => (
                      <div key={date} className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">
                          {formatDate(date)}
                        </h4>
                        <div className="space-y-2">
                          {slots.map(slot => (
                            <div key={slot.id} className="flex justify-between items-center bg-gray-50 rounded p-2">
                              <div className="text-sm">
                                <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                                {slot.is_recurring && (
                                  <span className="ml-2 text-xs bg-[#F5F5F5] text-[#005B9C] px-2 py-1 rounded">
                                    Semanal
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveSlot(slot.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agendamentos Confirmados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Agendamentos Confirmados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedAppointments).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum agendamento confirmado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedAppointments)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, appointments]) => (
                      <div key={date} className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">
                          {formatDate(date)}
                        </h4>
                        <div className="space-y-2">
                          {appointments
                            .filter(apt => apt.status === 'confirmed')
                            .map(apt => (
                              <div key={apt.id} className="bg-green-50 rounded p-2">
                                <div className="text-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{apt.start_time} - {apt.end_time}</p>
                                      <p className="text-gray-600">{apt.client_name}</p>
                                      {apt.service_name && <p className="text-gray-600">{apt.service_name}</p>}
                                    </div>
                                    {apt.service_price && (
                                      <span className="text-green-700 font-semibold">
                                        R$ {apt.service_price.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderSchedule;
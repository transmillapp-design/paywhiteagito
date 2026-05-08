import React, { useState } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const BookingModal = ({ serviceId, serviceProviderId, isOpen, onClose }) => {
  const { user, token, API } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário');
      return;
    }

    try {
      setBooking(true);
      
      await axios.post(
        `${API}/bookings/create`,
        {
          service_provider_id: serviceProviderId,
          service_id: serviceId,
          date: selectedDate,
          time: selectedTime,
          notes: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ Agendamento realizado!', {
        description: `${selectedDate} às ${selectedTime}`
      });
      
      onClose();
      
      // Navigate to bookings page after a delay
      setTimeout(() => {
        navigate('/agendamentos');
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.detail || 'Erro ao agendar serviço');
    } finally {
      setBooking(false);
    }
  };

  // Generate time slots (8:00 to 18:00)
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 18) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Get next 30 days
  const getNextDays = (count) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const availableDates = getNextDays(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full sm:max-w-md sm:mx-4 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#2A3618]' : 'bg-white'
        } rounded-t-2xl sm:rounded-2xl`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-sm bg-opacity-90 ${
          isDark ? 'border-[#556B2F] bg-[#2A3618]' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <Calendar className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
              Agendar Serviço
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-gray-100'
            }`}
          >
            <X className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date Selection */}
          <div>
            <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-[#333333]'
            }`}>
              <Calendar size={16} />
              Selecione a Data
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#3F5123] border-[#556B2F] text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-[#005B9C]`}
            >
              <option value="">Escolha uma data</option>
              {availableDates.map((date) => {
                const dateObj = new Date(date + 'T00:00:00');
                const formatted = dateObj.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                });
                return (
                  <option key={date} value={date}>
                    {formatted}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Time Selection */}
          <div>
            <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-[#333333]'
            }`}>
              <Clock size={16} />
              Selecione o Horário
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === time
                      ? isDark
                        ? 'bg-[#005B9C] text-[#2A3618]'
                        : 'bg-[#005B9C] text-white'
                      : isDark
                        ? 'bg-[#556B2F] text-[#E5C34A] hover:bg-[#6B8239]'
                        : 'bg-gray-100 text-[#005B9C] hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-[#333333]'
            }`}>
              <User size={16} />
              Observações (opcional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o serviço que você precisa..."
              rows={3}
              className={isDark ? 'bg-[#3F5123] border-[#556B2F] text-white' : ''}
              maxLength={500}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
              {notes.length}/500 caracteres
            </p>
          </div>

          {/* Summary */}
          {selectedDate && selectedTime && (
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-[#3F5123] border border-[#005B9C]' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start gap-2">
                <CheckCircle className={isDark ? 'text-[#005B9C]' : 'text-green-600'} size={20} />
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-green-900'}`}>
                    Confirmação do Agendamento
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-[#E5C34A]' : 'text-green-700'}`}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-green-700'}`}>
                    às {selectedTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Book Button */}
          <Button
            onClick={handleBooking}
            disabled={booking || !selectedDate || !selectedTime}
            className={`w-full ${
              isDark
                ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
            } disabled:opacity-50`}
          >
            {booking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Agendando...
              </>
            ) : (
              <>
                <Calendar size={20} className="mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar, Scissors, XCircle } from 'lucide-react';

export const ClientAppointments = () => {
  const { appointments, currentUser, allStylists, allServices, updateAppointmentStatus } = useAppContext();
  const [confirmingApptId, setConfirmingApptId] = useState<string | null>(null);

  const myAppointments = appointments.filter(a => a.clientId === currentUser?.id);

  return (
    <div className="px-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Agendamentos</h1>

      {myAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum agendamento realizado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myAppointments.map(appt => {
            const stylist = allStylists.find(s => s.id === appt.stylistId);
            const service = allServices.find(s => s.id === appt.serviceId);
            const date = new Date(appt.date);

            return (
              <div key={appt.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <img src={stylist?.avatar} alt={stylist?.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900">{stylist?.name}</h4>
                      <p className="text-xs text-gray-500">{service?.name}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    appt.status === 'CONFIRMADO' 
                      ? 'bg-green-100 text-green-600' 
                      : appt.status === 'CANCELADO'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                  }`}>
                    {appt.status}
                  </div>
                </div>
                
                <div className="mb-3 block bg-slate-50/80 border border-slate-100 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente do Agendamento</span>
                  <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{appt.clientName || currentUser.name}</span>
                </div>
                
                <div className="py-3 border-t border-b border-gray-50 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600 font-medium capitalize">
                    <Calendar size={16} className="mr-2 text-pink-500" />
                    {format(date, "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center text-gray-600 font-medium">
                    <Clock size={16} className="mr-2 text-pink-500" />
                    {format(date, 'HH:mm')}
                  </div>
                </div>

                {appt.status !== 'CANCELADO' && (
                  confirmingApptId === appt.id ? (
                    <div className="mt-3.5 flex items-center space-x-2 w-full">
                      <button
                        onClick={() => {
                          updateAppointmentStatus(appt.id, 'CANCELADO');
                          setConfirmingApptId(null);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 border border-red-600"
                      >
                        <XCircle size={14} />
                        <span>Sim, Desmarcar</span>
                      </button>
                      <button
                        onClick={() => setConfirmingApptId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border border-slate-200"
                      >
                        Voltar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingApptId(appt.id)}
                      className="mt-3.5 w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 border border-red-100"
                    >
                      <XCircle size={14} />
                      <span>Desmarcar Horário</span>
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

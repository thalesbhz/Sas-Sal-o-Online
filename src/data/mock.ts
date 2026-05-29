import { addDays, set } from 'date-fns';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  icon: string; // lucide icon name or type
  salonId?: string;
}

export interface Stylist {
  id: string;
  name: string;
  avatar: string;
  services: string[]; // service ids
  rating: number;
  salonId?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  stylistId: string;
  serviceId: string;
  date: string; // ISO string
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  salonId?: string;
}


export const services: Service[] = [];

export const stylists: Stylist[] = [];

const today = new Date();

export const initialAppointments: Appointment[] = [];


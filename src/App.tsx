/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { MobileLayout } from './components/MobileLayout';
import { ClientHome } from './pages/client/Home';
import { ClientBooking } from './pages/client/Booking';
import { ClientAppointments } from './pages/client/Appointments';
import { ClientProfile } from './pages/client/Profile';
import { StylistAgenda } from './pages/client/StylistAgenda';
import { AdminDashboard } from './pages/admin/Dashboard';
import { GeneralDashboard } from './pages/admin/GeneralDashboard';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Client Mobile UI */}
          <Route element={<MobileLayout />}>
            <Route path="/" element={<ClientHome />} />
            <Route path="/:salonSlug" element={<ClientHome />} />
            <Route path="/book/:serviceId" element={<ClientBooking />} />
            <Route path="/appointments" element={<ClientAppointments />} />
            {/* Real profile route */}
            <Route path="/profile" element={<ClientProfile />} />
            {/* Real-time shared agenda links */}
            <Route path="/agenda" element={<StylistAgenda />} />
            <Route path="/agenda/:stylistId" element={<StylistAgenda />} />
          </Route>
          
          {/* Admin UI (simulating a separate dashboard accessible via the app) */}
          <Route path="/vogue-admin" element={<AdminDashboard />} />
          
          {/* General/Network Super Admin UI */}
          <Route path="/admin-geral" element={<GeneralDashboard />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

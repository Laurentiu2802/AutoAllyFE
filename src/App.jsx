import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/dashboard.jsx";
import Appointments from "./pages/Appointments.jsx";
import MechanicAppointments from "./pages/MechanicAppointments.jsx";

function PrivateRoute({ children, keycloak }) {
  return keycloak.authenticated ? children : <Navigate to="/" />;
}

export default function App({ keycloak }) {
  const [authenticated, setAuthenticated] = useState(keycloak.authenticated);

  useEffect(() => {
    const interval = setInterval(() => {
      keycloak.updateToken(30).then((refreshed) => {
        setAuthenticated(keycloak.authenticated);
      }).catch(() => {
        setAuthenticated(false);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [keycloak]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute keycloak={keycloak}>
              <Dashboard keycloak={keycloak} />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/appointments"
          element={
            <PrivateRoute keycloak={keycloak}>
              <Appointments keycloak={keycloak} />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/mechanic/appointments"
          element={
            <PrivateRoute keycloak={keycloak}>
              <MechanicAppointments keycloak={keycloak} />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
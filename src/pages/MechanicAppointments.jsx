import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isMechanic } from "../utils/auth";
import "./MechanicAppointments.css";

export default function MechanicAppointments({ keycloak }) {
  const navigate = useNavigate();
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMechanic(keycloak)) {
      navigate('/dashboard');
      return;
    }
    
    loadPendingAppointments();
    loadAllAppointments();
  }, [keycloak]);

  const loadPendingAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/appointments/mechanic/pending', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingAppointments(data);
      }
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    }
  };

  const loadAllAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/appointments/mechanic/all', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllAppointments(data);
      }
    } catch (error) {
      console.error('Error loading all appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      const response = await fetch(`http://localhost:8081/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadPendingAppointments();
        loadAllAppointments();
      } else {
        const error = await response.text();
        alert(`Failed: ${error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error connecting to server');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'orange',
      ACCEPTED: 'green',
      DECLINED: 'red',
      COMPLETED: 'blue',
      CANCELLED: 'gray'
    };
    return <span className="status-badge" style={{backgroundColor: colors[status]}}>{status}</span>;
  };

  return (
    <div className="mechanic-appointments-page">
      <div className="page-header">
        <h1>Appointment Management</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'pending' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests ({pendingAppointments.length})
        </button>
        <button 
          className={activeTab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('all')}
        >
          All Appointments ({allAppointments.length})
        </button>
      </div>

      {loading ? (
        <p>Loading appointments...</p>
      ) : (
        <>
          {activeTab === 'pending' && (
            <div className="pending-section">
              <h2>Pending Requests</h2>
              {pendingAppointments.length === 0 ? (
                <p>No pending appointment requests.</p>
              ) : (
                <div className="appointments-list">
                  {pendingAppointments.map(apt => (
                    <div key={apt.id} className="appointment-card pending">
                      <div className="appointment-header">
                        <h3>Request from {apt.carEnthusiastId}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleString()}</p>
                      <p><strong>Description:</strong> {apt.description}</p>
                      <p className="created-date">Requested: {new Date(apt.createdAt).toLocaleDateString()}</p>
                      
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'ACCEPTED')}
                          className="accept-btn"
                        >
                          ✓ Accept
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'DECLINED')}
                          className="decline-btn"
                        >
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="all-section">
              <h2>All Appointments</h2>
              {allAppointments.length === 0 ? (
                <p>No appointments yet.</p>
              ) : (
                <div className="appointments-list">
                  {allAppointments.map(apt => (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-header">
                        <h3>Appointment #{apt.id}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p><strong>Customer:</strong> {apt.carEnthusiastId}</p>
                      <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleString()}</p>
                      <p><strong>Description:</strong> {apt.description}</p>
                      <p className="created-date">Created: {new Date(apt.createdAt).toLocaleDateString()}</p>
                      {apt.updatedAt && (
                        <p className="updated-date">Updated: {new Date(apt.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
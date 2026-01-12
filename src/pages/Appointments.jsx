import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isCarEnthusiast } from "../utils/auth";
import "./Appointments.css";


export default function Appointments({ keycloak }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [filteredMechanics, setFilteredMechanics] = useState([]); 
  const [mechanicSearch, setMechanicSearch] = useState(''); 
  const [showDropdown, setShowDropdown] = useState(false); 
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    mechanicId: '',
    appointmentDate: '',
    description: ''
  });

  useEffect(() => {
    if (!isCarEnthusiast(keycloak)) {
      navigate('/dashboard');
      return;
    }
    
    loadAppointments();
    loadMechanics();
  }, [keycloak]);

  const loadAppointments = async () => {
    try {
      const response = await fetch('https://localhost:8443/api/appointments/my-appointments', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMechanics = async () => {
  try {
    const response = await fetch('https://localhost:8443/api/users?role=MECHANIC', {
      headers: {
        'Authorization': `Bearer ${keycloak.token}`,
      },
    });

    if (response.ok) {
      const users = await response.json();
      setMechanics(users);
      setFilteredMechanics(users);
    }
  } catch (error) {
    console.error('Error loading mechanics:', error);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Creating appointment...');

    try {
      const response = await fetch('https://localhost:8443/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Appointment created successfully!');
        setFormData({ mechanicId: '', appointmentDate: '', description: '' });
        setShowForm(false);
        loadAppointments();
      } else {
        const error = await response.text();
        setMessage(`Failed: ${error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error connecting to server');
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
    <div className="appointments-page">
      <div className="page-header">
        <h1>My Appointments</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      <button 
        onClick={() => setShowForm(!showForm)} 
        className="toggle-form-btn"
      >
        {showForm ? '- Cancel' : '+ Book New Appointment'}
      </button>

      {showForm && (
        <div className="appointment-form-section">
          <h2>Book New Appointment</h2>
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-group">
              <label>Select Mechanic:</label>
              <select
                value={formData.mechanicId}
                onChange={(e) => setFormData({...formData, mechanicId: e.target.value})}
                required
              >
                <option value="">Choose a mechanic...</option>
                {mechanics.map(mechanic => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.username} - {mechanic.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date & Time:</label>
              <input
                type="datetime-local"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what you need help with..."
                rows="4"
                required
              />
            </div>

            <button type="submit" className="submit-btn">Book Appointment</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      )}

      <div className="appointments-section">
        <h2>Your Appointments</h2>
        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p>No appointments yet. Book your first appointment!</p>
        ) : (
          <div className="appointments-list">
            {appointments.map(apt => (
              <div key={apt.id} className="appointment-card">
                <div className="appointment-header">
                  <h3>Appointment #{apt.id}</h3>
                  {getStatusBadge(apt.status)}
                </div>
                <p><strong>Mechanic:</strong> {apt.mechanicId}</p>
                <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleString()}</p>
                <p><strong>Description:</strong> {apt.description}</p>
                <p className="created-date">Created: {new Date(apt.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
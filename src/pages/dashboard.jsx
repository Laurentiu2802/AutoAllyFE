import React, { useEffect, useState } from "react";

export default function Dashboard({ keycloak }) {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (keycloak.authenticated ) {
      // Register user in backend
      fetch('http://localhost:8081/api/users/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        console.log('User registered:', data);
        setRegistered(true);
      })
      .catch(error => console.error('Error:', error));
    }
  }, [keycloak.authenticated]);

  const handleLogout = () => {
    keycloak.logout();
  };

  return (
    <div>
      <h1>You logged in!</h1>
      {registered && <p>✅ User registered in database</p>}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
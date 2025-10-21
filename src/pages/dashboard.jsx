import React, { useEffect } from "react";

export default function Dashboard({ keycloak }) {
  const handleLogout = () => {
    keycloak.logout();
  };
useEffect(()=>{
      if (keycloak.authenticated) {
      console.log("Token:", keycloak.token);}
      
})


  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome! You are authenticated.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}    
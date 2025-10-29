import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import keycloak from "./components/keycloak.js";

function startApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App keycloak={keycloak} />
    </React.StrictMode>
  );
}

keycloak.init({
  onLoad: "check-sso",  
  checkLoginIframe: false, 
  pkceMethod: "S256",      
}).then((authenticated) => {
  if (authenticated) {
    startApp(); 
  } else {
    keycloak.login();
  }
}).catch((error) => {
  console.error("Failed to initialize Keycloak:", error);
});
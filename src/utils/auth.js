export const getUserFromToken = (keycloak) => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }

  const token = keycloak.tokenParsed;
  
  return {
    userId: token.sub,
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    username: token.preferred_username,
    roles: token.realm_access?.roles || [],
  };
};

export const isMechanic = (keycloak) => {
  const user = getUserFromToken(keycloak);
  return user?.roles.includes('MECHANIC') || false;
};

export const isCarEnthusiast = (keycloak) => {
  const user = getUserFromToken(keycloak);
  return user?.roles.includes('CAR_ENTHUSIAST') || false;
};
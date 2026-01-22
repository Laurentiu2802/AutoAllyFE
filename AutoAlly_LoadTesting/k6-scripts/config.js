export const config = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:8081',
  KEYCLOAK_URL: __ENV.KEYCLOAK_URL || 'http://localhost:8080',
  REALM: 'AutoAlly',
  CLIENT_ID: 'autoally-rest-api',
  TEST_USERNAME: __ENV.TEST_USERNAME || 'testuser1',
  TEST_PASSWORD: __ENV.TEST_PASSWORD || 'test123',
};

export function getTestUser(num) {
  if (num < 1 || num > 1000) {
    throw new Error('User number must be between 1 and 1000');
  }
  return {
    username: `testuser${num}`,
    password: 'test123'
  };
}

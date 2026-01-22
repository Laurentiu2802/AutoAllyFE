import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, getRandomTestUser } from './config.js';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.005'],
  }
};

const tokenCache = {};

function getToken(username, password) {
  if (tokenCache[username]) return tokenCache[username];
  
  const response = http.post(
    `${config.KEYCLOAK_URL}/realms/${config.REALM}/protocol/openid-connect/token`,
    { grant_type: 'password', client_id: config.CLIENT_ID, username, password },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  const token = response.json('access_token');
  tokenCache[username] = token;
  return token;
}

export default function () {
  const user = getRandomTestUser();
  const token = getToken(user.username, user.password);
  
  if (!token) return;

  // ONLY GET POSTS - NO CREATE/DELETE
  const response = http.get(
    `${config.BASE_URL}/api/posts?page=0&size=100`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  check(response, {
    'status 200': (r) => r.status === 200,
    'under 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
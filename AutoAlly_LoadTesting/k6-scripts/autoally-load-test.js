import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, getTestUser } from './config.js';

export const options = {
  setupTimeout: '120s',
  stages: [
    { duration: '3m', target: 100 },   // Slower ramp
    { duration: '5m', target: 500 },   // Slower ramp
    { duration: '7m', target: 1000 },  // MUCH slower to 1000
    { duration: '10m', target: 1000 }, // Hold longer
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

let tokens = {};

export function setup() {
  console.log('Authenticating 1000 users...');
  for (let i = 1; i <= 1000; i++) {
    const user = getTestUser(i);
    const body = `grant_type=password&client_id=${config.CLIENT_ID}&username=${user.username}&password=${user.password}`;
    const response = http.post(`${config.KEYCLOAK_URL}/realms/${config.REALM}/protocol/openid-connect/token`, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (response.status === 200) tokens[i] = response.json('access_token');
    if (i % 100 === 0) console.log(`Authenticated ${i}/1000`);
  }
  return { tokens };
}

export default function(data) {
  const userId = (__VU % 1000) + 1;
  const token = data.tokens[userId];
  if (!token) return;
  
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  // CREATE POST
  const createRes = http.post(`${config.BASE_URL}/api/posts`, JSON.stringify({ title: `Test Post ${Date.now()}`, content: `Load testing AutoAlly`, tags: ['test', 'performance'] }), { headers });
  check(createRes, {
    'post created': (r) => r.status === 200 || r.status === 201,
    'has post id': (r) => r.json('id') !== undefined,
  });
  
  sleep(2);
  
  // BROWSE POSTS
  const browseRes = http.get(`${config.BASE_URL}/api/posts?page=0&size=100`, { headers });
  check(browseRes, {
    'browse successful': (r) => r.status === 200,
    'has posts array': (r) => Array.isArray(r.json()) || r.json().content !== undefined,
  });
  
  sleep(3);
  
  // REFRESH
  const refreshRes = http.get(`${config.BASE_URL}/api/posts?page=0&size=100`, { headers });
  check(refreshRes, { 'refresh successful': (r) => r.status === 200 });
  
  sleep(2);
  
  // Random delay
  sleep(Math.random() * 3 + 1);
}

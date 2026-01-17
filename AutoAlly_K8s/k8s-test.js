import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
};

export default function () {
  const token = http.post(
    'http://keycloak:8080/realms/AutoAlly/protocol/openid-connect/token',
    {
      grant_type: 'password',
      client_id: 'autoally-rest-api',
      username: 'testuser1',
      password: 'test123'
    },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  ).json('access_token');

  const res = http.post(
    'http://api-gateway/api/posts',
    JSON.stringify({ title: 'Test', content: 'Test', tags: ['test'] }),
    { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  check(res, { 'success': (r) => r.status === 200 || r.status === 201 });
}
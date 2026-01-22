import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

function getToken() {
  const tokenUrl = config.KEYCLOAK_URL + '/realms/' + config.REALM + '/protocol/openid-connect/token';
  
  const payload = {
    grant_type: 'password',
    client_id: config.CLIENT_ID,
    username: config.TEST_USERNAME,
    password: config.TEST_PASSWORD,
  };

  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const response = http.post(tokenUrl, payload, params);
  
  if (response.status === 200) {
    return response.json('access_token');
  }
  
  return null;
}

export default function () {
  const token = getToken();
  
  if (!token) {
    console.error('Failed to get token');
    return;
  }

  const headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  };

  const postPayload = JSON.stringify({
    title: 'Test Post ' + Date.now(),
    content: 'Load testing AutoAlly',
    tags: ['loadtest', 'performance'],
  });

  const createResponse = http.post(
    config.BASE_URL + '/api/posts',
    postPayload,
    { headers }
  );

  check(createResponse, {
    'post created': (r) => r.status === 200 || r.status === 201,
    'create under 2s': (r) => r.timings.duration < 2000,
  });

  const postId = createResponse.json('id');
  sleep(2);

  const browseResponse = http.get(
    config.BASE_URL + '/api/posts',
    { headers }
  );

  check(browseResponse, {
    'browse successful': (r) => r.status === 200,
    'browse under 2s': (r) => r.timings.duration < 2000,
  });

  sleep(3);

  if (postId) {
    const deleteResponse = http.del(
      config.BASE_URL + '/api/posts/' + postId,
      null,
      { headers }
    );

    check(deleteResponse, {
      'post deleted': (r) => r.status === 200 || r.status === 204,
    });
  }

  sleep(Math.random() * 3 + 2);
}

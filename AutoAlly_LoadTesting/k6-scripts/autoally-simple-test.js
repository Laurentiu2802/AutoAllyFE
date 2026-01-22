import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

export const options = {
  vus: 10,
  duration: '30s',
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
  
  check(response, {
    'got token': (r) => r.status === 200,
  });

  return response.json('access_token');
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
    title: 'Load Test Post ' + Date.now(),
    content: 'Testing AutoAlly post creation under load',
    tags: ['load-test', 'performance'],
  });

  const createResponse = http.post(
    config.BASE_URL + '/api/posts',
    postPayload,
    { headers }
  );

  check(createResponse, {
    'post created successfully': (r) => r.status === 200 || r.status === 201,
    'response time under 2s': (r) => r.timings.duration < 2000,
  });

  const postId = createResponse.json('id');
  
  sleep(1);

  const viewAllResponse = http.get(
    config.BASE_URL + '/api/posts',
    { headers }
  );

  check(viewAllResponse, {
    'view all posts successful': (r) => r.status === 200,
    'view all under 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

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

  sleep(1);
}

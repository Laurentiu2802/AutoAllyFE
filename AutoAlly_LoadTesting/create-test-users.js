const http = require('http');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'AutoAlly';
const CLIENT_ID = 'autoally-admin';
const CLIENT_SECRET = 'FjO6C9NXlYwFIoC7BbRfQ6Bd1iav4Ffy';

async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString();

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/realms/' + REALM + '/protocol/openid-connect/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).access_token);
        } else {
          reject(new Error('Failed to get token: ' + res.statusCode + ' - ' + body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createUser(token, username, email) {
  return new Promise((resolve, reject) => {
    const userData = JSON.stringify({
      username: username,
      email: email,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: 'test123',
          temporary: false,
        },
      ],
    });

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/admin/realms/' + REALM + '/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': userData.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(username);
        } else if (res.statusCode === 409) {
          resolve(username);
        } else {
          console.error('Failed ' + username + ': ' + res.statusCode + ' - ' + body);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Error ' + username + ':', err.message);
      resolve(null);
    });
    req.write(userData);
    req.end();
  });
}

async function getUserId(token, username) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/admin/realms/' + REALM + '/users?username=' + username,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
    };

    http.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const users = JSON.parse(body);
          resolve(users[0] ? users[0].id : null);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function assignRole(token, userId, roleName) {
  return new Promise(async (resolve) => {
    const getRoleOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/admin/realms/' + REALM + '/roles/' + roleName,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
    };

    http.get(getRoleOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve(false);
          return;
        }
        
        const role = JSON.parse(body);
        const roleData = JSON.stringify([{ id: role.id, name: role.name }]);
        
        const assignOptions = {
          hostname: 'localhost',
          port: 8080,
          path: '/admin/realms/' + REALM + '/users/' + userId + '/role-mappings/realm',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Content-Length': roleData.length,
          },
        };

        const req = http.request(assignOptions, (res) => {
          resolve(res.statusCode === 204);
        });
        req.on('error', () => resolve(false));
        req.write(roleData);
        req.end();
      });
    });
  });
}

async function createTestUsers() {
  console.log('Getting admin token...');
  const token = await getAdminToken();
  console.log('Admin token obtained!');
  console.log('Starting user creation...\n');

  const totalUsers = 1000;
  const batchSize = 5;
  let created = 0;

  for (let i = 1; i <= totalUsers; i += batchSize) {
    const promises = [];
    
    for (let j = i; j < i + batchSize && j <= totalUsers; j++) {
      const username = 'testuser' + j;
      const email = 'testuser' + j + '@autoally.com';
      promises.push(
        createUser(token, username, email).then(async (result) => {
          if (result) {
            const userId = await getUserId(token, username);
            if (userId) {
              await assignRole(token, userId, 'CAR_ENTHUSIAST');
            }
            return true;
          }
          return false;
        })
      );
    }

    const results = await Promise.all(promises);
    created += results.filter(r => r).length;
    console.log('Progress: ' + created + '/' + totalUsers + ' users created');
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\nUser creation complete!');
  console.log('All users have password: test123');
  console.log('All users have role: CAR_ENTHUSIAST');
}

createTestUsers().catch(console.error);

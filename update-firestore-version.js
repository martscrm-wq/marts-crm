const {GoogleAuth} = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const { createSign } = require('crypto');

const sa = JSON.parse(fs.readFileSync('sa-key.json', 'utf8').replace(/^\uFEFF/, ''));
const version = process.argv[2] || '2.4.0';
const notes = process.argv[3] || 'System update';

async function getGoogleTime() {
  return new Promise((resolve, reject) => {
    https.get('https://www.google.com', res => {
      resolve(Math.floor(new Date(res.headers['date']).getTime() / 1000));
    }).on('error', reject);
  });
}

async function main() {
  const serverTime = await getGoogleTime();
  
  const header = Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: serverTime,
    exp: serverTime + 3600
  })).toString('base64url');
  const data = header + '.' + payload;
  const sign = createSign('RSA-SHA256').update(data).sign(sa.private_key, 'base64url');
  const jwt = data + '.' + sign;

  const tokenRes = await new Promise((resolve, reject) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt);
    req.end();
  });

  const token = tokenRes.access_token;
  if (!token) { console.error('Token error:', tokenRes); process.exit(1); }

  const projectId = 'marts-crm-6ca37';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system_config/version`;
  
  const body = JSON.stringify({
    fields: {
      version: { stringValue: version },
      notes: { stringValue: notes },
      updatedAt: { integerValue: String(Date.now()) },
      updatedBy: { stringValue: 'deploy_script' }
    }
  });

  const patchRes = await new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (patchRes.status === 200 || patchRes.status === 201) {
    console.log('Firestore version updated to', version);
  } else {
    console.error('Failed to update Firestore version:', patchRes.status, patchRes.body.substring(0, 300));
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });

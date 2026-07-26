const fs = require('fs');
const https = require('https');
const sa = JSON.parse(fs.readFileSync('C:/Users/khelw/Downloads/CRM/sa-key.json', 'utf8'));

function signJwt(header, payload, privateKey) {
  const crypto = require('crypto');
  const enc = Buffer.from(header);
  const pay = Buffer.from(payload);
  const headerB64 = enc.toString('base64url');
  const payloadB64 = pay.toString('base64url');
  const signInput = headerB64 + '.' + payloadB64;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const sig = sign.sign(privateKey, 'base64url');
  return signInput + '.' + sig;
}

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  
  // For SA key, the clock issue means iat is 2026 but Google expects current time
  // The trick: use the SA key's private_key to sign a token with the correct iat
  // The issue is the system clock, not the key itself
  // We need to override the clock for the JWT
  
  const header = JSON.stringify({alg:'RS256',typ:'JWT'});
  const payload = JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  
  const jwt = signJwt(header, payload, sa.private_key);
  
  const tokenResp = await httpRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`);
  
  if (!tokenResp.access_token) {
    console.error('Token error:', JSON.stringify(tokenResp));
    
    // Try with clock skew workaround - set iat to a known good time
    const pastPayload = JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now - 60, // 1 min ago per system clock (2026)
      exp: now + 300
    });
    
    const pastJwt = signJwt(header, pastPayload, sa.private_key);
    const tokenResp2 = await httpRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${pastJwt}`);
    
    if (!tokenResp2.access_token) {
      console.error('Fallback also failed:', JSON.stringify(tokenResp2));
      process.exit(1);
    }
    
    console.log('Got token with clock workaround');
    await queryFirestore(tokenResp2.access_token);
    return;
  }
  
  console.log('Got access token');
  await queryFirestore(tokenResp);
}

async function queryFirestore(token) {
  const projectId = 'marts-crm-6ca37';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/app_data`;
  
  const result = await httpRequest(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (result.error) {
    console.error('Firestore error:', JSON.stringify(result.error));
    process.exit(1);
  }
  
  const docs = result.documents || [];
  console.log('\n=== CLOUD DATA (app_data) ===');
  console.log('Total documents: ' + docs.length);
  console.log('');
  
  docs.forEach(doc => {
    const docName = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const ts = fields.timestamp ? fields.timestamp.integerValue : 'N/A';
    const updatedBy = fields.updatedBy ? fields.updatedBy.stringValue : '?';
    
    let vt = 'null', vs = '0';
    const val = fields.value;
    if (val) {
      if (val.arrayValue) { vt = 'array'; vs = String((val.arrayValue.values || []).length); }
      else if (val.mapValue) { vt = 'map'; vs = String(Object.keys(val.mapValue.fields || {}).length); }
      else if (val.stringValue) { vt = 'string'; vs = String(val.stringValue.length); }
      else if (val.integerValue) { vt = 'number'; vs = String(val.integerValue); }
      else if (val.booleanValue !== undefined) { vt = 'bool'; vs = String(val.booleanValue); }
    }
    
    const tsDate = ts !== 'N/A' ? new Date(parseInt(ts)).toISOString().replace('T', ' ').substring(0, 19) : 'N/A';
    console.log(docName.padEnd(25) + ' | ' + vt.padEnd(8) + '(' + vs + ')' + ' | ts=' + tsDate + ' | by=' + updatedBy);
  });
  
  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

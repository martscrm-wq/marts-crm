const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const sa = JSON.parse(fs.readFileSync('C:/Users/khelw/Downloads/CRM/sa-key.json', 'utf8'));
const PROJECT_ID = 'marts-crm-6ca37';
const API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getServerTime() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: '/v1/',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      const date = res.headers['date'];
      if (date) resolve(new Date(date).getTime() / 1000);
      else resolve(Math.floor(Date.now() / 1000));
    });
    req.on('error', () => resolve(Math.floor(Date.now() / 1000)));
    req.end();
  });
}

function signJwt(header, payload, privateKey) {
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
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
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const serverTime = await getServerTime();
  console.log('Real server time (seconds):', serverTime, '| local clock:', Math.floor(Date.now() / 1000));
  const now = Math.floor(serverTime);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const jwt = signJwt(header, payload, sa.private_key);
  const resp = await httpRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`);

  if (!resp.access_token) {
    throw new Error('Token failed: ' + JSON.stringify(resp));
  }
  return resp.access_token;
}

async function listAllDocs(token, collection) {
  const all = [];
  let nextPageToken = null;
  do {
    const qs = nextPageToken ? `?pageSize=300&pageToken=${encodeURIComponent(nextPageToken)}` : '?pageSize=300';
    const url = `${API}/${collection}${qs}`;
    const result = await httpRequest(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (result.error) throw new Error(collection + ' error: ' + JSON.stringify(result.error));
    if (result.documents) all.push(...result.documents);
    nextPageToken = result.nextPageToken || null;
  } while (nextPageToken);
  return all;
}

async function fetchFullDoc(token, docRefPath) {
  const url = `${API}/${docRefPath}`;
  const result = await httpRequest(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (result.error) return null;
  return result;
}

function decodeValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue) return (val.arrayValue.values || []).map(decodeValue);
  if (val.mapValue) {
    const out = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) out[k] = decodeValue(v);
    return out;
  }
  if (val.timestampValue) return val.timestampValue;
  if (val.referenceValue) return val.referenceValue;
  if (val.bytesValue) return val.bytesValue;
  return val;
}

function docToPlain(doc) {
  const id = doc.name.split('/').pop();
  const fields = doc.fields || {};
  const out = { _id: id, _createTime: doc.createTime, _updateTime: doc.updateTime };
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

async function main() {
  const token = await getAccessToken();
  console.log('Got access token OK');

  const collections = ['app_data', 'activity_logs', 'app_data_backup', 'system_config'];
  const backup = { exportedAt: new Date().toISOString(), collections: {} };

  for (const coll of collections) {
    const docs = await listAllDocs(token, coll);
    console.log(`\n[${coll}] ${docs.length} documents`);

    const records = docs.map(docToPlain);
    backup.collections[coll] = records;

    for (const r of records) {
      const keys = Object.keys(r).filter(k => !k.startsWith('_')).slice(0, 6).join(',');
      const arrLen = r.value && Array.isArray(r.value) ? ` [arr:${r.value.length}]` : '';
      console.log('  -', r._id, arrLen, keys ? '(' + keys + ')' : '');
    }
  }

  const backupDir = 'C:/Users/khelw/Downloads/CRM/backups';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 19);
  const outFile = `${backupDir}/cloud-backup-${ts}.json`;
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2), 'utf8');

  const totalDocs = Object.values(backup.collections).reduce((a, c) => a + c.length, 0);
  console.log(`\n=== BACKUP DONE ===`);
  console.log('Collections:', Object.keys(backup.collections).join(', '));
  console.log('Total documents:', totalDocs);
  console.log('Saved to:', outFile);
  console.log('File size:', fs.statSync(outFile).size, 'bytes');

  // Retention: keep only the latest 14 backups
  const old = fs.readdirSync(backupDir).filter(f => f.startsWith('cloud-backup-')).sort();
  while (old.length > 14) {
    const f = old.shift();
    fs.unlinkSync(`${backupDir}/${f}`);
    console.log('Removed old backup:', f);
  }

  // Summary log
  const summary = `${new Date().toISOString()} | docs=${totalDocs} (app_data=${backup.collections.app_data.length}, activity_logs=${backup.collections.activity_logs.length}, app_data_backup=${backup.collections.app_data_backup.length}, system_config=${backup.collections.system_config.length}) | ${outFile}\n`;
  fs.appendFileSync(`${backupDir}/backup-summary.txt`, summary);
  console.log('Summary appended to backup-summary.txt');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

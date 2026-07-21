const admin = require('firebase-admin');
const serviceAccount = require('./sa-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
db.collection('system_config').doc('version').set({
  version: '2.2.0',
  updatedAt: new Date(),
  notes: 'CRM v2.2.0 - Update progress indicator',
  deployedBy: 'manual'
}, { merge: true }).then(() => {
  console.log('Firestore version doc updated to 2.2.0');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

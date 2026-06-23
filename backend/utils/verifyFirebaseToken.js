import jwt from 'jsonwebtoken';
import https from 'https';

let cachedKeys = null;
let keysExpiry = 0;

const fetchKeys = () => {
  return new Promise((resolve, reject) => {
    if (cachedKeys && Date.now() < keysExpiry) {
      return resolve(cachedKeys);
    }

    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const keys = JSON.parse(data);
          
          // Cache keys based on Cache-Control max-age header if available, default to 6 hours
          const cacheControl = res.headers['cache-control'] || '';
          const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
          const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 6 * 60 * 60 * 1000;
          
          cachedKeys = keys;
          keysExpiry = Date.now() + maxAge;
          resolve(keys);
        } catch (err) {
          reject(new Error('Failed to parse Google public keys JSON'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

export const verifyFirebaseToken = async (idToken) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // If Firebase Project ID is not configured or is the default placeholder, decode without signature verification in development
  if (!projectId || projectId.trim() === '' || projectId.includes('your-firebase-project-id')) {
    console.warn('⚠️ FIREBASE_PROJECT_ID is not set or is using the default placeholder. Signature verification will be skipped in development.');
    const decoded = jwt.decode(idToken);
    if (!decoded) {
      throw new Error('Failed to decode token');
    }
    return decoded;
  }

  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid token format or missing key ID (kid)');
  }

  const kid = decodedHeader.header.kid;
  const keys = await fetchKeys();
  const cert = keys[kid];

  if (!cert) {
    throw new Error('Public key not found for kid: ' + kid);
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      cert,
      {
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      }
    );
  });
};

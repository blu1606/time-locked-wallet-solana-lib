import { PublicKey } from '@solana/web3.js';
import * as types from '../packages/core/dist/types.js';

const valid = '11111111111111111111111111111111';
const invalid = 'zzz';

try {
  console.log('Testing valid string key...');
  types.validatePublicKey(valid);
  console.log('OK');
} catch (e) {
  console.error('Valid string failed:', e.message);
}

try {
  console.log('Testing PublicKey instance...');
  const pk = new PublicKey(valid);
  types.validatePublicKey(pk);
  console.log('OK');
} catch (e) {
  console.error('PublicKey instance failed:', e.message);
}

try {
  console.log('Testing invalid key...');
  types.validatePublicKey(invalid);
  console.error('Invalid key unexpectedly passed');
} catch (e) {
  console.log('Invalid key correctly failed:', e.message);
}

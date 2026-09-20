import { loadTestEnv } from './env';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Test uploads go to a temp folder so they never pollute the real uploads directory.
Object.assign(process.env, loadTestEnv(), { NODE_ENV: 'test', THROTTLE_DISABLED: 'true', UPLOAD_DIR: join(tmpdir(), 'aura-jewels-test-uploads') });

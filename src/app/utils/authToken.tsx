import { randomBytes } from 'crypto';

export function generateAuthToken(): string {
  return randomBytes(16).toString('hex');
}

// src/lib/secrets.js
import { supabase } from './supabase';

const secretsCache = {};

/**
 * Safely resolves secret API keys first from environment variables (local)
 * and falls back to Supabase app_secrets table (remote).
 */
export async function getSecret(keyName, defaultValue = '') {
  if (import.meta.env && import.meta.env[keyName]) {
    return import.meta.env[keyName];
  }
  if (secretsCache[keyName]) {
    return secretsCache[keyName];
  }
  try {
    const { data } = await supabase.from('app_secrets').select('key_value').eq('key_name', keyName).single();
    if (data?.key_value) {
      secretsCache[keyName] = data.key_value;
      return data.key_value;
    }
  } catch (e) {}
  return defaultValue;
}

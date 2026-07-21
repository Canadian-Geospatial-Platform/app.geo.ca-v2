#!/usr/bin/env node

/**
 * Staging go/no-go preflight validator.
 *
 * Validates OIDC deployment prerequisites from a stage env file and optional AWS checks.
 * Exits with status 1 when blocker checks fail, otherwise exits with status 0.
 *
 * Supported flags:
 * --stage, --region, --base-url, --env-file, --skip-aws.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

/**
 * Gets a string argument value that follows a flag.
 *
 * @param {string} flag - CLI flag name to look up (for example --stage).
 * @param {string} [fallback=''] - Fallback value when the flag is absent.
 * @returns {string} Parsed argument value or fallback.
 */
function getArg(flag, fallback = '') {
  const index = args.indexOf(flag);
  if (index === -1) {
    return fallback;
  }

  const next = args[index + 1];
  if (!next || next.startsWith('--')) {
    return fallback;
  }

  return next;
}

/**
 * Returns true when the specified flag exists in CLI args.
 *
 * @param {string} flag - CLI flag name to check.
 * @returns {boolean} True when present.
 */
function hasFlag(flag) {
  return args.includes(flag);
}

/**
 * Parses a dotenv-like file string into key/value pairs.
 *
 * Ignores blank lines and comments. Supports quoted values.
 *
 * @param {string} content - Raw dotenv file content.
 * @returns {Record<string, string>} Parsed env key/value object.
 */
function parseDotEnvFile(content) {
  const parsed = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

/**
 * Performs lightweight validation on an AWS Secrets Manager secret identifier.
 *
 * Accepts full ARNs or simple secret names containing allowed characters.
 *
 * @param {string} secretId - Secret name or ARN.
 * @returns {{ ok: true; type: 'arn' | 'name' } | { ok: false; reason: string }} Validation result.
 */
function checkSecretsManagerId(secretId) {
  if (!secretId) {
    return { ok: false, reason: 'empty' };
  }

  if (secretId.startsWith('arn:aws:secretsmanager:')) {
    return { ok: true, type: 'arn' };
  }

  if (/^[A-Za-z0-9/_+=.@-]+$/.test(secretId)) {
    return { ok: true, type: 'name' };
  }

  return { ok: false, reason: 'invalid-characters' };
}

/**
 * Runs an AWS CLI command synchronously and captures output.
 *
 * @param {string[]} argsToRun - Arguments passed to the aws executable.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} Child process result.
 */
function runAws(argsToRun) {
  return spawnSync('aws', argsToRun, { encoding: 'utf8' });
}

const stage = getArg('--stage', 'staging');
const region = getArg('--region', 'ca-central-1');
const baseUrl = getArg('--base-url', '');
const envPath = resolve(getArg('--env-file', `.env.${stage}`));
const skipAws = hasFlag('--skip-aws');

const blockers = [];
const warnings = [];
const passes = [];

console.log('Staging Go/No-Go Validation');
console.log('============================');
console.log(`Stage: ${stage}`);
console.log(`Env file: ${envPath}`);
console.log(`Region: ${region}`);
if (baseUrl) {
  console.log(`Base URL: ${baseUrl}`);
}
console.log('');

if (!existsSync(envPath)) {
  blockers.push(`Missing env file: ${envPath}`);
} else {
  passes.push(`Env file exists: ${envPath}`);
}

let env = {};
if (existsSync(envPath)) {
  env = parseDotEnvFile(readFileSync(envPath, 'utf8'));
}

const oidcClientId = env.OIDC_CLIENT_ID ?? '';
const oidcCustomDomain = env.OIDC_CUSTOM_DOMAIN ?? '';
const oidcPrivateKeySecretId = env.OIDC_PRIVATE_KEY_SECRET_ID ?? '';

if (!oidcClientId) {
  blockers.push('OIDC_CLIENT_ID is missing or empty.');
} else {
  passes.push('OIDC_CLIENT_ID is present.');
}

if (!oidcCustomDomain) {
  blockers.push('OIDC_CUSTOM_DOMAIN is missing or empty.');
} else {
  try {
    const parsedDomain = new URL(oidcCustomDomain);
    const hasUnexpectedPath = parsedDomain.pathname && parsedDomain.pathname !== '/';
    if (hasUnexpectedPath) {
      blockers.push('OIDC_CUSTOM_DOMAIN must be host-only and must not include a path such as /oauth2.');
    } else {
      passes.push('OIDC_CUSTOM_DOMAIN is host-only.');
    }
  } catch {
    blockers.push('OIDC_CUSTOM_DOMAIN is not a valid URL.');
  }
}

const privateKeyRequired = stage === 'staging' || stage === 'production';
if (privateKeyRequired && !oidcPrivateKeySecretId) {
  blockers.push(`OIDC_PRIVATE_KEY_SECRET_ID is required for stage '${stage}'.`);
} else if (!privateKeyRequired && !oidcPrivateKeySecretId) {
  warnings.push(`OIDC_PRIVATE_KEY_SECRET_ID is not set. Stage '${stage}' will rely on client_secret_post unless runtime config changes.`);
} else {
  const secretCheck = checkSecretsManagerId(oidcPrivateKeySecretId);
  if (!secretCheck.ok) {
    blockers.push('OIDC_PRIVATE_KEY_SECRET_ID is malformed (unsupported characters or format).');
  } else {
    passes.push(`OIDC_PRIVATE_KEY_SECRET_ID format looks valid (${secretCheck.type}).`);
  }
}

if (baseUrl) {
  try {
    const parsedBase = new URL(baseUrl);
    if (parsedBase.protocol !== 'https:') {
      warnings.push('Base URL is not https; staging should generally use https.');
    } else {
      passes.push('Base URL uses https.');
    }

    const requiredPaths = ['/sign-in/receive', '/sign-in/logout', '/sign-in/back-channel-logout'];
    passes.push(`Validate these OIDC allowlist URLs in provider config: ${requiredPaths.map((p) => `${parsedBase.origin}${p}`).join(', ')}`);
  } catch {
    blockers.push('Provided --base-url is not a valid URL.');
  }
} else {
  warnings.push('No --base-url provided; allowlist URL checks were not generated.');
}

if (!skipAws) {
  const awsVersion = runAws(['--version']);
  const awsCliAvailable = awsVersion.status === 0 || Boolean(awsVersion.stdout || awsVersion.stderr);

  if (!awsCliAvailable) {
    warnings.push('AWS CLI is not available on PATH; skipped AWS identity/secret checks.');
  } else {
    const sts = runAws(['sts', 'get-caller-identity', '--output', 'json']);
    if (sts.status !== 0) {
      blockers.push('AWS credentials are not usable (sts get-caller-identity failed).');
    } else {
      passes.push('AWS credentials are usable (sts get-caller-identity passed).');
    }

    if (oidcPrivateKeySecretId) {
      const secretDescribe = runAws([
        'secretsmanager',
        'describe-secret',
        '--secret-id',
        oidcPrivateKeySecretId,
        '--region',
        region,
        '--output',
        'json',
      ]);

      if (secretDescribe.status !== 0) {
        blockers.push(`Unable to describe OIDC private key secret '${oidcPrivateKeySecretId}' in region '${region}'.`);
      } else {
        passes.push('OIDC private key secret is accessible via AWS CLI.');
      }
    }
  }
}

if (stage !== 'staging' && stage !== 'production') {
  warnings.push(`Stage '${stage}' is not one of {staging, production}. Runtime currently enforces private_key_jwt only for those names.`);
}

console.log('Checks');
console.log('------');
for (const line of passes) {
  console.log(`PASS: ${line}`);
}
for (const line of warnings) {
  console.log(`WARN: ${line}`);
}
for (const line of blockers) {
  console.log(`BLOCKER: ${line}`);
}

console.log('');
if (blockers.length > 0) {
  console.log(`RESULT: NO-GO (${blockers.length} blocker${blockers.length === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log(`RESULT: GO (${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
process.exit(0);

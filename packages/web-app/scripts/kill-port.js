#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

// Cross-platform helper for local development.
// It force-kills any process listening on PORT, then waits briefly for release.
// We need to use port 8080 to comply with sign in redirect URIs for local development.
const PORT = 8080;
const WAIT_MS = 3000;
const CHECK_INTERVAL_MS = 120;
const isWindows = platform() === 'win32';

console.warn(`[Port Cleanup] Warning: this will force-kill any process listening on port ${PORT}.`);

function run(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function isPortInUse() {
  if (isWindows) {
    // Query Windows listeners and return whether at least one process owns PORT.
    const output = run(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"`
    );
    return output.length > 0;
  }

  return run(`lsof -ti :${PORT}`).length > 0;
}

function getListeningPids() {
  if (isWindows) {
    // Get unique owning PIDs for listeners on PORT and skip this script's PID.
    const output = run(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`
    );

    return output
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  }

  const output = run(`lsof -ti :${PORT}`);
  return output
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
}

function killPids(pids) {
  // Use native platform commands to avoid external runtime dependencies.
  for (const pid of pids) {
    if (isWindows) {
      run(`taskkill /F /PID ${pid}`);
    } else {
      run(`kill -9 ${pid}`);
    }
  }
}

const beforeInUse = isPortInUse();
const pids = getListeningPids();

if (pids.length > 0) {
  killPids(pids);
}

// Wait briefly for the OS to release the port after termination.
const start = Date.now();
while (Date.now() - start < WAIT_MS) {
  if (!isPortInUse()) {
    break;
  }

  // Busy wait to keep this script dependency-free and synchronous.
  const until = Date.now() + CHECK_INTERVAL_MS;
  while (Date.now() < until) {
    // no-op
  }
}

if (beforeInUse && !isPortInUse()) {
  console.log(`[Port Cleanup] Cleaned up port ${PORT}`);
} else if (beforeInUse && isPortInUse()) {
  console.warn(`[Port Cleanup] Port ${PORT} is still in use`);
}

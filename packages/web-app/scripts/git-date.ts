import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const gitCommitDate = execFileSync('git', ['log', '-1', '--format=%cs'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  encoding: 'utf8',
}).trim();

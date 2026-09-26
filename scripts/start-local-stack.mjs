import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function launch(command, args, env, label) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    console.log(`\n[${label}] exited with code ${code ?? 'unknown'}`);
    process.exit(code ?? 1);
  });

  child.on('error', (err) => {
    console.error(`[${label}] failed to start:`, err.message);
    process.exit(1);
  });

  return child;
}

const phpExecutable = process.env.PHP_BIN || 'php';
const phpExists = existsSync('C:/Program Files/php/php.exe') || existsSync('C:/tools/php/php.exe');
const phpAvailable = phpExists || !!process.env.PHP_BIN;

if (!phpAvailable) {
  console.error('PHP is not installed or not on PATH. Install PHP or set PHP_BIN before running this stack.');
  process.exit(1);
}

console.log('[php-api] starting on http://127.0.0.1:8888');
launch(phpExecutable, ['-S', '127.0.0.1:8888', '-t', 'php-api'], { CLIENT_URL: 'http://localhost:5173' }, 'php-api');

setTimeout(() => {
  console.log('[vite] starting on http://localhost:5173');
  launch('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], { VITE_API_URL: 'http://127.0.0.1:8888' }, 'vite');
}, 800);

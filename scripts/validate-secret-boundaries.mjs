import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distOnly = process.argv.includes('--dist');
const errors = [];
const fail = message => errors.push(message);

const SERVER_ONLY_ENV_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY'
];

const FORBIDDEN_VITE_SECRET = /\bVITE_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET(?:_|$)|PRIVATE(?:_|$)|WEBHOOK(?:_|$)|ADMIN_KEY|SIGNING_KEY|ENCRYPTION_KEY)[A-Z0-9_]*\b/g;
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.md', '.txt', '.map']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel']);
const CLIENT_SKIP_DIRS = new Set(['api', 'server', 'scripts', 'migrations', 'docs', '.github']);

const literalSecretPatterns = [
  ['Stripe secret key', /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ['Stripe webhook secret', /\bwhsec_[A-Za-z0-9]{16,}\b/g],
  ['OpenAI-style secret key', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ['AWS access key', /\bAKIA[A-Z0-9]{16}\b/g]
];

function walk(dir, { skip = SKIP_DIRS } = {}) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, { skip }));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function scanLiteralSecrets(file, text) {
  for (const [label, pattern] of literalSecretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) fail(`${relative(file)} contains a credential-shaped ${label}. Store secrets only in deployment secret storage.`);
  }

  const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
  for (const token of text.match(jwtPattern) || []) {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      if (['service_role', 'supabase_admin'].includes(String(decoded?.role || ''))) {
        fail(`${relative(file)} contains a Supabase privileged JWT (${decoded.role}). Privileged JWTs must never be committed or shipped.`);
      }
    } catch {
      // Ignore non-JSON JWT-like strings; credential-shape checks above still apply.
    }
  }
}

function scanClientBoundary(file, text) {
  for (const envName of SERVER_ONLY_ENV_NAMES) {
    if (text.includes(envName)) fail(`${relative(file)} references server-only environment variable ${envName}.`);
  }
  FORBIDDEN_VITE_SECRET.lastIndex = 0;
  const match = FORBIDDEN_VITE_SECRET.exec(text);
  if (match) fail(`${relative(file)} contains forbidden browser-exposed secret variable ${match[0]}.`);
}

if (distOnly) {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(dist)) fail('dist/ is missing; the post-build secret-boundary check must run after vite build.');
  for (const file of walk(dist)) {
    const text = read(file);
    scanLiteralSecrets(file, text);
    scanClientBoundary(file, text);
  }
} else {
  // Scan the complete current worktree for committed credential-shaped literals.
  for (const file of walk(root)) scanLiteralSecrets(file, read(file));

  // Browser entry points live at the repository root plus public/src when present.
  const rootClientFiles = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile() && ['.js', '.mjs', '.html', '.css'].includes(path.extname(entry.name).toLowerCase()))
    .map(entry => path.join(root, entry.name));
  const clientFiles = [
    ...rootClientFiles,
    ...walk(path.join(root, 'public'), { skip: CLIENT_SKIP_DIRS }),
    ...walk(path.join(root, 'src'), { skip: CLIENT_SKIP_DIRS })
  ];
  for (const file of clientFiles) scanClientBoundary(file, read(file));

  const envExample = path.join(root, 'env.example');
  if (fs.existsSync(envExample)) {
    const text = read(envExample);
    FORBIDDEN_VITE_SECRET.lastIndex = 0;
    const match = FORBIDDEN_VITE_SECRET.exec(text);
    if (match) fail(`env.example defines forbidden browser-exposed secret variable ${match[0]}.`);
  }

  const supabaseClient = path.join(root, 'supabase.js');
  if (fs.existsSync(supabaseClient)) {
    const text = read(supabaseClient);
    if (!text.includes('VITE_SUPABASE_ANON_KEY')) fail('supabase.js must use the browser-safe Supabase anon/publishable key.');
    if (/service[_-]?role/i.test(text)) fail('supabase.js must not reference a Supabase service-role credential.');
  }
}

if (errors.length) {
  for (const error of [...new Set(errors)]) console.error(`Secret-boundary validation error: ${error}`);
  process.exit(1);
}

console.log(distOnly
  ? 'Built browser output passed secret-boundary validation.'
  : 'Current worktree and browser source passed secret-boundary validation.');

const { spawn } = require('child_process');

const limit = process.argv[2] || process.env.PURGE_LIMIT || '';
if (!/^(all|[1-9]\d*)$/.test(limit)) {
  console.error('Usage: npm run purge -- <count|all>');
  console.error('Examples:');
  console.error('  npm run purge -- 100');
  console.error('  npm run purge -- 300');
  console.error('  npm run purge -- 1000');
  console.error('  npm run purge -- all');
  process.exit(1);
}

const child = spawn(
  'npx',
  ['playwright', 'test', '--config=playwright.manual.config.js'],
  {
    stdio: 'inherit',
    env: { ...process.env, PURGE_LIMIT: limit },
    shell: true,
  },
);

child.on('exit', (code) => process.exit(code ?? 1));

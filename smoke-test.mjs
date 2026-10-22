import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['backend/server.js'], { stdio: 'pipe' }),
  spawn(process.execPath, ['frontend/node_modules/vite/bin/vite.js', 'frontend', '--host', '0.0.0.0'], { stdio: 'pipe' })
];
try {
  await Promise.all(children.map(child => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 15000);
    child.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    child.once('error', err => { clearTimeout(timer); reject(err); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    child.stderr.on('data', data => process.stderr.write(data));
  })));
  for (const url of ['http://127.0.0.1:5000/api/race', 'http://127.0.0.1:5173/']) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Startup check failed: ${url}`);
    console.log(`${url} -> ${response.status}`);
  }
} finally { children.forEach(child => child.kill()); }

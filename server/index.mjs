import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createBackendServer } from './http.mjs';

const rootEnv = new URL('../.env', import.meta.url);
if (existsSync(rootEnv)) loadEnvFile(rootEnv.pathname);

const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a valid port number.');
  process.exit(1);
}
const server = createBackendServer();
server.on('error', () => { console.error('Backend could not start. Check whether its port is already in use.'); process.exit(1); });
server.listen(port, '0.0.0.0', () => console.log(`ResuMate JavaScript backend listening on port ${port}.`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10000).unref();
});

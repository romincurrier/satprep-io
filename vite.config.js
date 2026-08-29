import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{main:resolve(process.cwd(),'index.html'),testLab:resolve(process.cwd(),'test-lab.html'),householdTest:resolve(process.cwd(),'household-test.html'),pilotControl:resolve(process.cwd(),'pilot-control.html'),livePilotMonitor:resolve(process.cwd(),'live-pilot-monitor.html')}}}});

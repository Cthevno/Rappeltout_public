import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { ViteDevServer } from 'vite';
import { serverOptions } from "./src/lib/server/serverOptions.ts";
import { setupHouse } from './src/lib/server/houseWebSockets.ts';
import { setupNotifications } from './src/lib/server/notificationsWebSockets.ts';

// Mounts the Socket.IO servers (chat, tasks, house) on Vite's HTTP server during `npm run dev`,
// so /socket.io/ behaves the same as in the `runner` stage (server.ts).
function socketIoDev() {
	return {
		name: 'socket-io-dev',
		configureServer(vite: ViteDevServer) {
			if (!vite.httpServer) return;
			// Dynamic import so vitest / config evaluation doesn't load prisma & socket.io.
			Promise.all([
				import('socket.io'),
				import('./src/lib/server/chatWebSockets'),
				import('./src/lib/server/tasksWebSockets'),
				import('./src/lib/server/socketInstance')
			]).then(([{ Server }, { setupChat }, { setupTasks }, { setIO }]) => {
				const io = new Server(vite.httpServer!, serverOptions);
				setIO(io);
				setupChat(io);
				setupTasks(io);
				setupHouse(io);
				setupNotifications(io);
			}).catch((error) => {
				console.error('[socket-io-dev] failed to mount Socket.IO server:', error);
			});
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), socketIoDev()],
	server: { port: 3000, host: '0.0.0.0', allowedHosts: ['sveltekit'] },
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			// Vitest 4 always reports every matching `include` file, even ones
			// no test imports yet, so untested routes show up as 0% instead of being omitted.
			include: ['src/routes/**/+page.server.ts']
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [
							{ browser: 'chromium', headless: true },
							{ browser: 'firefox', headless: true },
							// Safari
							{ browser: 'webkit', headless: true }
						]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

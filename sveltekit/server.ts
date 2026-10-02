/**
 * @file server.ts
 *
 * @brief Application entry point: initializes the HTTP server and the Socket.IO real-time infrastructure.
 *
 * @details Creates the Node.js HTTP server that serves the SvelteKit application,
 * attaches a Socket.IO server for real-time communication, and wires up every
 * real-time feature (chat, tasks, house, notifications) by delegating to their
 * dedicated setup modules. The Socket.IO instance is also stored globally (setIO)
 * so that any server-side module can emit events through getIO.
 *
 * step 1 : initialize the HTTP server
 *  - create a Node.js HTTP server.
 *  - forward every request to SvelteKit except Socket.IO requests.
 *  - attach a Socket.IO server with CORS configuration.
 *
 * step 2 : register the real-time feature modules
 *  - store the Socket.IO instance globally so other modules can access it (setIO/getIO).
 *  - register the chat, tasks, house and notifications event handlers
 *    (setupChat, setupTasks, setupHouse, setupNotifications).
 *  - each setup module registers its own connection handling and event logic.
 *
 * step 3 : start the server
 *  - listen on the host and port given by environment variables,
 *    with defaults (0.0.0.0:3000) so the server also runs in dev mode.
 */

import { createServer } from "node:http";
import { Server } from "socket.io";
// @ts-expect-error — handler.js is generated at build time
// and only lives in the sveltekit container.
import { handler as svelteKitHandler } from "./handler.js";
import { type IncomingMessage, type ServerResponse } from 'http';
import { setupChat } from "./src/lib/server/chatWebSockets.ts";
import { setupTasks } from "./src/lib/server/tasksWebSockets.ts";
import { setupHouse } from "./src/lib/server/houseWebSockets.ts"
import { serverOptions } from "./src/lib/server/serverOptions.ts";
import { setIO } from "./src/lib/server/socketInstance.ts";
import { setupNotifications } from "./src/lib/server/notificationsWebSockets.ts";

// Create a Node.js HTTP server and forward every request to SvelteKit except Socket.IO requests.
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/socket.io/'))
		return;
	svelteKitHandler(req, res);
});

// Attach a Socket.IO server to the HTTP server (options such as CORS come from serverOptions).
const io = new Server(server, serverOptions);

// The function that will store io and will make it accessible with getIO
setIO(io);
// The logic to handle the chat's sockets.
setupChat(io);
// The logic to handle the tasks's sockets.
setupTasks(io);
// The logic to handle the house's sockets.
setupHouse(io);

// The logic to handle notification sockets.
setupNotifications(io);

// Allow the server to connect to env specified host and port with defaults if not set.
// It permits to run it in dev mode.
server.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? "0.0.0.0");

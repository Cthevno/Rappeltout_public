/**
 * @file socketInstance.ts
 * @brief a global io var declared to be accessible from anywhere with getIO(), 
 * and setIO() is called in server.ts and vite.config.ts to initialise our global io
 */

import type { Server } from "socket.io";

declare global {
    var __io: Server | undefined;
}

export function setIO(io: Server): void {
    globalThis.__io = io;
}

export function getIO(): Server | undefined {
    return globalThis.__io;
}
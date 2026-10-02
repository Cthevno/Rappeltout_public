/**
 * @file monsterWebSockets.ts
 * @brief a small function used to notify that the monster has been updated
 */
import { Server } from "socket.io";

export function notifyMonsterUpdated(io: Server, houseCode: string) {
	io.to(houseCode).emit("monsterUpdated");
}
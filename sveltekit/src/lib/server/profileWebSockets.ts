/**
 * @file profileWebSockets.ts
 * @brief a small function used to notify a profile has been updated
 */
import { Server } from "socket.io";

/**
 * @brief Notifies all clients in a specific house room that a user profile has been updated.
 * @param io (Server) The Socket.IO server instance.
 * @param houseCode (string) The unique code identifying the house room to broadcast to.
 * @return (void)
 */
export function notifyProfileUpdated(io: Server, houseCode: string) {
    io.to(houseCode).emit("profileUpdated");
}
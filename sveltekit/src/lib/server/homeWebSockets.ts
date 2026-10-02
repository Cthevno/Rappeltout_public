import { Server } from "socket.io";

/**
 * @brief The Home's websocket logic.
 *
 * @param io (Server) io The server to connect to.
 * @param houseCode (string) code to join the room 
 */
export function HomeUpdate(io: Server, houseCode: string): void {
	io.to(houseCode).emit("HomeUpdate");
}
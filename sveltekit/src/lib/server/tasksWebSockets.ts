import { Server, Socket } from "socket.io";

/**
 * @brief The tasks's websocket logic.
 * @param io (Server) The server to connect to.
 */
export function setupTasks(io: Server): void {
	io.on("connection", (socket: Socket) => {
		// Update if the task changes.
		socket.on("taskChanged", ({ houseCode }: { houseCode: string } = { houseCode: "" }) => {
			if (!houseCode || typeof houseCode !== "string" || houseCode.trim() === "") {
				console.error("Invalid or missing houseCode");
				return;
			}
			socket.to(houseCode).emit("tasksUpdated");
		})
	});
}

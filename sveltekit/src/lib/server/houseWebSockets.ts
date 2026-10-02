import { Server, Socket } from "socket.io";

/**
 * @brief The Houses's websocket logic.
 * @param io (Server) The server to connect to.
 */
export function setupHouse(io: Server): void {
    io.on("connection", (socket: Socket) => {
        // Update if the house changes.
        socket.on("houseChanged", ({ houseCode }: { houseCode: string } = { houseCode: "" }) => {
            if (!houseCode || typeof houseCode !== "string" || houseCode.trim() === "") {
                console.error("Invalid or missing houseCode");
                return;
            }
            socket.to(houseCode).emit("houseUpdated");
        })
    });
}

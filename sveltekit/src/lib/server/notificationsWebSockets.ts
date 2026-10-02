import { Server, Socket } from "socket.io";
import { prisma } from "./prisma";
import { getIO } from "./socketInstance";

/**
 * @brief Sends a real-time notification update to one user.
 *
 * @param userId User receiving the notification.
 */
export function emitNotificationUpdate(userId: number): void {
    const io = getIO();

    if (!io) {
        console.error("Notification Socket.IO instance is not initialized");
        return;
    }

    io.to(`user:${userId}`)
        .emit("notificationsUpdated");
}

/**
 * @brief Sets up the WebSocket logic used by notifications.
 *
 * Each authenticated user joins a private room named `user:<id>`.
 *
 * @param io Socket.IO server.
 */
export function setupNotifications(io: Server): void {

    io.on("connection", async (socket: Socket) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie;

            if (!cookieHeader) {
                console.warn("Notification socket connection rejected: missing cookies");
                return;
            }

            const sessionCookie = cookieHeader
                .split(";")
                .map((cookie) => cookie.trim())
                .find((cookie) => cookie.startsWith("session="));

            if (!sessionCookie) {
                console.warn("Notification socket connection rejected: missing session cookie");
                return;
            }

            const sessionId = decodeURIComponent(
                sessionCookie.substring("session=".length)
            );

            const session = await prisma.session.findUnique({
                where: {
                    id: sessionId
                },
                include: {
                    user: true
                }
            });

            if (!session || session.endedAt <= new Date()) {
                console.warn("Notification socket connection rejected: invalid or expired session");
                return;
            }
            socket.join(`user:${session.user.id}`);
        } catch (error) {
            console.error(
                "Error when authenticating notification socket",
                error
            );
        }
    });
}
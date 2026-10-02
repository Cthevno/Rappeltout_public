import { Server, Socket } from "socket.io";
import { prisma } from './prisma';
import cookie from 'cookie';

/**
 * @brief The chat's websocket logic.
 *
 * @param io (Server) The server to connect to.
 */
export function setupChat(io: Server): void {
	io.on("connection", (socket: Socket) => {

		/**
		 * @brief Get authenticate user from cookie
		 */
		async function getAuthenticatedUser() {
			const cookieHeader = socket.handshake.headers.cookie;
			if (!cookieHeader) {
				console.error('No cookie');
				return;
			}

			const cookies = cookie.parse(cookieHeader);
			const sessionId = cookies.session;
			if (!sessionId) {
				console.error('No session id');
				return;
			}

			const session = await prisma.session.findUnique({
				where: { id: sessionId },
				include: { user: true }
			});

			if (!session || session.endedAt < new Date()) {
				console.error('No session or expired session');
				return;
			}

			return session.user;
		}
		/**
		 * @brief Join a chat room:
		 *
		 * @param houseCode (string) The code of the house room to join.
		 * Resolves once the message history is emitted to the client.
		 */
		socket.on("house", async (houseCode: string) => {
			try {

				// check houseCode is ok
				if (!houseCode || typeof houseCode !== 'string' || houseCode.trim() === '') {
					console.error('Invalid or missing houseCode');
					return;
				}

				// handle authenticate user
				const user = await getAuthenticatedUser();
				if (!user) {
					console.error('Not connected');
					return;
				}

				// check if user is in house
				const isMember = await prisma.user.findFirst({
					where: {
						id: user.id,
						housesJoined: {
							some: {
								code: houseCode
							}
						}
					}
				});
				if (!isMember) {
					console.error('Unauthorized access attempt to house');
					return;
				}

				// Add the client to the requested house room.
				socket.join(houseCode);

				// Retrieve the latest 20 messages from the database.
				const pastMessages = await prisma.message.findMany({
					where: { houseCode: houseCode },
					select: { id: true, content: true, createdAt: true, userId: true, user: { select: { username: true } } },
					orderBy: { createdAt: 'desc' },
					take: 20,
				});

				// Send the message history only to the newly connected client.
				socket.emit("loadHistory", pastMessages.reverse());
			}
			catch (error) {
				console.error("Error when loading history messages", error);
			}
		});

		/**
		 * @brief Leave a house room:
		 *
		 * @param houseCode (string) The code of the house room to leave.
		 */
		socket.on("leaveHouse", (houseCode: string) => {
			socket.leave(houseCode);
		});

		/**
		 * @brief Receive a message from a client:
		 *
		 * - data (Object) The message payload sent by the client.
		 * @param data.content (string) The text content of the message.
		 * @param data.houseCode (string) The code of the house room the message belongs to.
		 * Resolves once the message is saved and broadcasted.
		 */
		socket.on("message", async (data: { content: string; houseCode: string }) => {
			try {
				//------- check houseCode and content are valid
				if (!data || !data.houseCode || typeof data.houseCode !== 'string' || data.houseCode.trim() === '' ||
					!data.content || typeof data.content !== 'string' || data.content.trim() === '') {
					console.error('Invalid or missing houseCode or content');
					return;
				}

				//------- check content length
				if (data.content.length > 1000) {
					console.error('Message too long ! Maximum 1000 characters !')
					return;
				}

				// handle authenticate user
				const user = await getAuthenticatedUser();
				if (!user) {
					console.error('Not connected');
					return;
				}

				// check if user is in house
				const isMember = await prisma.user.findFirst({
					where: {
						id: user.id,
						housesJoined: {
							some: {
								code: data.houseCode
							}
						}
					}
				});
				if (!isMember) {
					console.error('Unauthorized access attempt to house');
					return;
				}
				// Store it in the database with its author and house.
				const newMessage = await prisma.message.create
					({
						data:
						{
							content: data.content,
							createdAt: new Date(),
							userId: user.id,
							houseCode: data.houseCode,
						},
						select: { id: true, content: true, createdAt: true, userId: true, user: { select: { username: true } } }
					})

				// Broadcast the saved message to every client in the same room.
				io.to(data.houseCode).emit("newMessage", newMessage);
			}
			catch (error) {
				console.error("Error when save message", error);
			}
		});

		/**
		 * @brief Load older messages:
		 *
		 * @param houseCode (string) The house room to fetch older messages for.
		 * @param idLastMsg (number) The ID of the oldest currently loaded message.
		 * Resolves once the older messages are emitted to the client.
		 */
		socket.on("getMoreMessages", async ({ houseCode, idLastMsg }: { houseCode: string, idLastMsg: number }) => {
			try {
				// check houseCode is ok
				if (!houseCode || typeof houseCode !== 'string' || houseCode.trim() === '') {
					console.error('Invalid or missing houseCode');
					return;
				}

				// handle authenticate user
				const user = await getAuthenticatedUser();
				if (!user) {
					console.error('Not connected');
					return;
				}

				// check if user is in house
				const isMember = await prisma.user.findFirst({
					where: {
						id: user.id,
						housesJoined: {
							some: {
								code: houseCode
							}
						}
					}
				});
				if (!isMember) {
					console.error('Unauthorized access attempt to house');
					return;
				}

				// Retrieve the oldest currently loaded message.
				const lastMsg = await prisma.message.findUnique
					({
						where: { id: idLastMsg }
					})

				if (!lastMsg)
					return;

				// Query the 20 previous messages from the database.
				const loadMsg = await prisma.message.findMany
					({
						where:
						{
							houseCode: houseCode,
							createdAt: { lt: lastMsg.createdAt }
						},
						select: { id: true, content: true, createdAt: true, userId: true, user: { select: { username: true } } },
						orderBy: { createdAt: 'desc' },
						take: 20,
					})

				// Send them back to the requesting client.
				socket.emit("loadMoreHistory", loadMsg.reverse())
			}
			catch (error) {
				console.error("Error when loading more message", error);
			}
		});
	});
}

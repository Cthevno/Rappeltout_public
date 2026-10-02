import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

/**
 * @brief Loads server-side data for the chat page and validates user authentication.
 *
 * This SvelteKit page server load function checks the user's active session cookie,
 * verifies its expiration, retrieves the user profile along with their joined houses
 * and messages from the database via Prisma, and handles redirection if unauthorized
 * or missing a house.
 *
 * Request cookies used to retrieve the session identifier.
 *
 * @returns Returns an object containing the username, user ID, current house code, and messages.
 *
 * step 1 : validate session cookie
 *  - retrieve the session ID from the incoming cookies.
 *  - redirect to the welcome page if the session token is missing.
 *
 * step 2 : verify session validity in the database
 *  - query the database for the session and include its associated user.
 *  - redirect to the welcome page if the session does not exist or has expired.
 *
 * step 3 : check user household membership
 *  - query the user's joined houses from the database.
 *  - redirect to the welcome page if the user record is not found.
 *  - redirect to the house management page if the user has joined no houses.
 *
 * step 4 : return page data payload
 *  - return the authenticated user's username, ID, current house code, and associated messages.
 */

export const load: PageServerLoad = async ({ cookies }) => {
    //------- validate session cookie
    const sessionId = cookies.get('session');

    if (!sessionId)
        throw redirect(303, '/auth/welcome');

    //------- query the database for the session and include its associated user.
    const session = await prisma.session.findUnique
        ({
            where: { id: sessionId },
            include: { user: true }
        });

    //------- redirect to the welcome page if the session does not exist or has expired
    if (!session || session.endedAt < new Date())
        throw redirect(303, '/auth/welcome');

    //------- check user household membership
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { housesJoined: true }
    });

    //------- redirect to the welcome page if the user record is not found
    if (!user)
        throw redirect(303, '/auth/welcome');

    const currentHouse = user.housesJoined[0];

    //------- redirect to the house management page if the user has joined no house
    if (!currentHouse)
        throw redirect(303, '/manage_house');

    //------- query messages for the current house
    const allMessages = await prisma.message.findMany({
        where: { houseCode: currentHouse.code },
        select: { id: true, content: true, createdAt: true, userId: true, user: { select: { username: true } } },
        orderBy: { createdAt: 'asc' },
        take: 20
    });

    //------- return the authenticated user's username, ID, current house code, and associated messages
    return {
        username: user.username,
        userId: user.id,
        houseCode: currentHouse.code,
        allMessages: allMessages.reverse(),
        seo: { title: "Chat - Rappeltout" }
    };
}



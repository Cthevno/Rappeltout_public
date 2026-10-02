import { prisma } from '$lib/server/prisma' //import prisma
import { redirect } from '@sveltejs/kit';
import { userHasHouse } from '$lib/server/house';

/**
 * @brief Global server-side request handler.
 * This hook intercepts every incoming request to the server.
 * 
 * - event : The current request context, including cookies and URL.
 * - resolve : The function to continue the request lifecycle.
 * 
 * step 1 : logout route detection
 * - identify the logout route so authentication guards do not redirect it.
 * 
 * step 2 : session retrieval
 * - attempt to get the 'session' ID from the browser cookies.
 * - if present, query the database to fetch the associated session and user data.
 * 
 * step 3 : session validation
 * - check if the session is valid and has not expired.
 * - attach the authenticated user to the request context ('event.locals').
 * 
 * step 4 : guard authenticated users
 * - if already connected and user is on an /auth page, go to home (don't need to connect)
 * 
 * step 5 : guard public access
 * - force unauthenticated users to the login page if they try to access protected areas.
 *
 * step 6 : guard house membership
 * - every logged-in user must belong to a house ; redirect to /house/create otherwise
 * - skipped for pages already under /house so the creation/join flow itself stays reachable
 *
 * step 7 : request resolution
 * - process the request and return the final response to the client.
 *
 */
export async function handle({ event, resolve }) {

    const is_logout = event.url.pathname === "/auth/logout";

    //------- attempt to get the 'session' ID from the browser cookies
    const sessionSearch = event.cookies.get('session');

    let session = null;

    //------- if present, query the database to fetch the associated session and user data.
    if (sessionSearch) {
        session = await prisma.session.findUnique
            ({
                where: { id: sessionSearch },
                include: { user: true }
            });
    }

    //------- check if the session is valid and has not expired.
    if (session && session.endedAt && session.endedAt > new Date()) {
        //------- attach the authenticated user to the request context ('event.locals')
        event.locals.user = session.user;
    }

    //------- if already connected go to /home
    if (
        !is_logout &&
        event.locals.user &&
        event.url.pathname.startsWith('/auth')
    ) {
        throw redirect(303, '/home');
    }


    //------- force unauthenticated users to the login page if they try to access protected areas
    if (!event.url.pathname.startsWith('/auth') && !event.locals.user && !(event.url.pathname === '/') && !(event.url.pathname === '/about') && !(event.url.pathname === '/privacy') && !(event.url.pathname === '/terms')) {
        throw redirect(303, '/auth/welcome');
    }

    //------- force logged-in users without a house to create/join one
    if (
        !is_logout &&
        event.locals.user &&
        !event.url.pathname.startsWith('/house') &&
        !event.url.pathname.startsWith('/api') &&
        !event.url.pathname.startsWith('/notifications') &&
        !event.url.pathname.startsWith('/settings')

    ) {
        const hasHouse = await userHasHouse(event.locals.user.id);
        if (!hasHouse) {
            throw redirect(303, '/house/create');
        }
    }

    //------- apply the user's theme to the HTML and return the final response
    const theme = (event.locals.user?.theme ?? "PARCHMENT").toLowerCase();

    const response = await resolve(event, {
        transformPageChunk: ({ html }) => {
            return html.replace("__THEME__", theme);
        },
    });

    return response;
}
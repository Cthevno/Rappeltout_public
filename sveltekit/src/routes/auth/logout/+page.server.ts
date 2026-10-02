import { redirect, type Actions } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { blockAuth } from '$lib/server/blockAuth';
import type { PageServerLoad } from './$types';


/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load : PageServerLoad = async ({ locals }) => {
    blockAuth(locals);
    return {};
}

/**
 * @brief Handles the user logout process.
 * * This server action terminates the user session by removing the session record
 * from the database and clearing the session cookie from the user's browser.
 * 
 * @param cookies (Cookies) Used to retrieve the current 'session' cookie and delete it.
 * 
 * @returns Redirects the user to the welcome page upon successful logout.
 *
 * step 1 : get the session token
 * - retrieve the 'session' cookie from the user's browser.
 *
 * step 2 : database cleanup
 * - if a session token exists, remove the corresponding session from the database
 *   to invalidate it server-side.
 *
 * step 3 : cookie cleanup
 * - remove the 'session' cookie from the browser (clearing the path '/').
 *
 * step 4 : redirection
 * - redirect the user to the welcome page ('/auth/welcome').
 */
export const actions : Actions = {

    default: async ({ cookies }) => {
        //------- retrieve the 'session' cookie from the user's browser
        const sessionToken = cookies.get('session');

        //------- if a session token exists, remove the corresponding session from the database to invalidate it server-side
        if (sessionToken) {
            await prisma.session.deleteMany({
                where: { id: sessionToken }
            });
        }

        //------- remove the 'session' cookie from the browser (clearing the path '/')
        cookies.delete('session', { path: '/' });

        //------- redirect the user to the welcome page ('/auth/welcome')
        throw (redirect(303, '/auth/welcome'));
    }
}

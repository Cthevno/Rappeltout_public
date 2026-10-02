import { randomUUID } from 'crypto';
import { redirect, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { blockAuth } from '$lib/server/blockAuth';
import type { PageServerLoad } from './$types';

/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load : PageServerLoad= async ({ locals }) => {
    blockAuth(locals);
    return {};
}

/**
 * @brief Redirects the user to Google's OAuth2 authentication page.
 * This action generates a secure OAuth state, stores it in a browser cookie to protect against attacks, 
 * builds the Google authorization URL, and redirects the user to Google's login page.
 * 
 * @param cookies (Cookies) Used to create the 'google' cookie.
 * 
 * @returns Return an error object if the configuration or process fails; otherwise, performs a 303 redirect. 
 * 
 * step 1 : cerate the OAuth state
 * - generate a unique random state with randomUUID()
 * - this value must be returned by Google after authentication
 * - it will be compared later to ensure the request was not forged
 * 
 * step 2 : store the state in a secure cookie 
 * - save th generated state in the browser 
 * - httpOnly : JavaScript cannot access the cookie
 * - sameSite - 'lax' : helps protect against Cross-Site Request Forgery while allowing the OAuth redirect + allow to send cookie to other website
 * - secure : send the cookie only over HTTPS
 * - maxAge - '300' : expires after 5 minutes
 * 
 * step 3 : build the Google authorization URL
 * - add the client ID
 * - specify the callback URL 
 * - request an authorization code 
 * - request the user's OpenID email and profile information
 * - include the generated state
 * - searchParams represents the query string of the URL (everything after '?')
 * 
 * step 4 : redirect the user
 * - send an HTTP 303 redirect to Google's OAuth2 
 * - throw : throwing it immediately stops the current action and sends an HTTP 303 response
 */
export const actions: Actions =
{
    default: async ({ cookies }) => {

        const clientId = env.GOOGLE_CLIENT_ID;
        const redirectUri = env.GOOGLE_REDIRECT_URI || 'https://localhost:8443/auth/googleReturn';

        if (!clientId || !redirectUri)
            throw redirect(303, '/auth/welcome?error=google_failed');

        let urlGoogle: URL;

        try {

            //------- create the OAuth state
            const state = randomUUID();

            //------- store the state in a secure cookie 
            cookies.set('google', state,
                {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: true,
                    maxAge: 300
                }
            );

            //------- build the Google authorization URL
            urlGoogle = new URL('https://accounts.google.com/o/oauth2/v2/auth');

            urlGoogle.searchParams.set('client_id', clientId);
            urlGoogle.searchParams.set('redirect_uri', redirectUri);
            urlGoogle.searchParams.set('response_type', 'code');
            urlGoogle.searchParams.set('scope', 'openid email profile');
            urlGoogle.searchParams.set('state', state);
            urlGoogle.searchParams.set('prompt', 'select_account');
        }

        catch (error) {
            throw redirect(303, '/auth/welcome?error=google_failed');
        }

        //------- redirect the user
        throw redirect(303, urlGoogle.toString());
    }
}
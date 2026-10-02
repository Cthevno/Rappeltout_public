import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/prisma';
import { redirect, isRedirect } from '@sveltejs/kit'; //type for server side where type Load is for client AND server. 
import { createSessionAndCookie } from '$lib/server/session'; //personnal function to delete session
import type { PageServerLoad } from './$types';

/**
 * @brief Handles the callback from Google's OAuth2 authentication. 
 * This function validates the security state, exchanges the autorization code for an 
 * access token, retrives user information, and manages the user session in the database. 
 * 
 * @param url (URL) Used to read the 'code' and 'state' OAuth query parameters.
 * @param cookies (Cookies) Used to read/delete the 'google' cookie and set the new 'session' cookie.
 * @param locals (App.Locals) Used to redirect immediately if the user already has a session.
 *
 * step 1 : validate OAuth parameters
 * - ensure 'code', 'state', and the 'google' cookie are present
 * - compare the state form the cookie with the URL state to prevent CSRF attacks
 * 
 * step 2 : exchange authorization code for access token
 * - build a POST request to Google's token endpoint
 * - send the client ID, secret, code and redirect URI
 * - verify the response to ensure we have valid access token
 * 
 * step 3 : retrieve user profile
 * - use the access token to fetch the user's email and profile from Google
 * - ensure the request was successful before proceeding
 * 
 * step 4 : manage user session
 * - check if the user exists in the database by email
 * - if not, create a new user entry (generate username)
 * - generate a unique session ID
 * - clear expired sessions and save the new session in the database 
 * - set a secure 'session' cookie in the browser 
 * 
 * step 5 : finalize 
 * - delete the temporary 'google' cookie
 * - redirect the user to the '/home' page upon successful login
 */
export const load: PageServerLoad = async ({ url, cookies, locals }) => {

    if (locals.user) {
        throw redirect(303, '/home');
    }

    const googleCookie = cookies.get('google');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    //------- validate OAuth parameters
    if (!googleCookie || !code || !state)
        throw redirect(303, '/auth/welcome?error=google_failed');

    if (googleCookie !== state) {

        cookies.delete('google', { path: '/' });

        throw redirect(303, '/auth/welcome?error=google_failed');
    }

    try {
        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_SECRET_ID;
        const redirectUri = env.GOOGLE_REDIRECT_URI || 'https://localhost:8443/auth/googleReturn';

        if (!clientId || !clientSecret)
            throw redirect(303, '/auth/welcome?error=config_error');

        //------- exchange authorization code for access token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri
                }).toString()
            });

        //------- verify the response to ensure we have valid access token
        if (!tokenResponse.ok)
            throw redirect(303, '/auth/welcome?error=google_failed');

        //------- Retrieve tokens that are cryptographic digital keys
        //------- However, these tokens do not yet contain the user's name or email.
        //------- They are simply keys to open other doors.
        const tokens = await tokenResponse.json();

        //------- retrieve user profile
        const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo",
            {
                method: "GET",
                headers: { 'Authorization': `Bearer ${tokens.access_token}` }
            }
        );

        //------- verify the response to ensure we have valid access profile
        if (!profileResponse.ok)
            throw redirect(303, '/auth/welcome?error=google_failed');

        //------- retrieves the user's Google information.
        const profile = await profileResponse.json();

        //------- ensure email exists and is a valid string
        if (!profile.email || typeof profile.email !== 'string') {
            throw redirect(303, '/auth/welcome?error=google_failed');
        }

        //------- reject unverified emails to prevent account takeover
        if (!profile.email_verified) {
            throw redirect(303, '/auth/welcome?error=google_failed');
        }

        const normalizedEmail = profile.email.toLowerCase().trim();

        //------- check if the user exists in the database by email
        let user = await prisma.user.findFirst
            ({
                where: { email: normalizedEmail }
            });

        if (user && user.accountValidated == false)
        {
            await prisma.user.update({
                where: {id: user.id},
                data: {
                    password: null,
                    accountValidated: true
                }
            });
        }
        //------- if not, create a new user entry
        if (!user) {
            //------- generate username
            let extractUsername = normalizedEmail.split('@')[0].substring(0, 10);
           
            if (extractUsername.length < 2)
                extractUsername = extractUsername + '_user';
           
            let suffix = 1;
            let finalUsername = extractUsername;

            while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
                finalUsername = `${extractUsername}${suffix}`;
                suffix++;
            }

            //------- create user
            user = await prisma.user.create({
                data: {
                    username: finalUsername,
                    email: normalizedEmail,
                    password: null,
                    accountValidated: true
                }
            });
        }

        //------- clear expired sessions, save the new session in the database and set a secure 'session' cookie in the browser 
        await createSessionAndCookie(user.id, cookies, 'lax');

        //------- delete the temporary 'google' cookie
        cookies.delete('google', { path: '/' });
    }

    catch (error) {
        //------- check if it's a voluntary redirection (like config_error) to avoid overwriting it with google_faile
        if (isRedirect(error))
            throw error;
        throw redirect(303, '/auth/welcome?error=google_failed');
    }

    //------- redirect the user to the '/home' page upon successful login
    throw redirect(303, '/home');
}
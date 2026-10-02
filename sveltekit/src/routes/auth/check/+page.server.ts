import { prisma } from '$lib/server/prisma'; //to use prisma
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSessionAndCookie } from '$lib/server/session'; //personnal function

/**
 * @brief Handles the 2FA verification and session establishment.
 * This action intercepts the verification request, validates the 2FA code
 * against the database using a secure random token cookie, manages session 
 * creation, and updates browser cookies.
 * 
 * @param request (Request) The incoming form data containing the 'code'.
 * @param cookies (Cookies) Used to retrieve the 'twoFA' token cookie and set the new 'session' cookie.
 * 
 * @returns a status object indicating success or failure with an error message.
 * 
 * step 1 : get the variables from form 
 * - with request.formData();
 * - get code with formData.get('code');
 * 
 * step 2 : all check
 * - check if cookie for 2FA exists, if not redirect to welcome page
 * - search the 2FA record corresponding to the secure token from the cookie, if nothing means session expired
 * - extract the associated userId safely from the database record
 * - check if the lifespan of the 2FA code has expired (after 5 minutes)
 * - security: atomic brute-force attempt protection (< 5 attempts)
 * - check if the code entered by the user matches the expected database code
 * 
 * step 3 : success
 * - validate the user account (accountValidated: true)
 * - delete the 2FA record from the database
 * - create the final permanent session and set the secure 'session' cookie
 * - delete the temporary 'twoFA' cookie
 * - return success: true
 */
export const actions: Actions =
{
    default: async ({ request, cookies }) => {

        const formData = await request.formData();
        const code = formData.get('code') as string;

        //------- check if cookie for 2FA exist, if not go back on welcome page
        const doesExist = cookies.get('twoFA');

        if (!doesExist) //no cookies
        {
            throw redirect(303, '/auth/welcome');
        }

        try {
            //------- empty
            if (code.trim() === "") {
                return { success: false, error: "Le code de vérification ne peut pas être vide." };
            }

            //------- length
            if (code.length !== 6) {
                return { success: false, error: "Le code n'est pas de la bonne longueur." };
            }

            //------- search the 2FA corresponding to the token from the cookie
            const twoFA = await prisma.twoFA.findUnique
            ({
                where: { token: doesExist },
                include: { user: true }
            })

            if (!twoFA) {
                return { success: false, error: "Session expirée, veuillez vous reconnecter." };
            }

            const userId = twoFA.userId;

             //------- check if code is expired (after 5 minutes)
            if (twoFA.expiresAt < new Date()) {
                await prisma.twoFA.delete({ where: { userId: userId } }).catch(() => {});
                cookies.delete('twoFA', { path: '/' });
                return { success: false, error: "Le code a expiré." };
            }

            //------- we attempt to increment the attempt count by 1 ONLY IF attempts < 5 and the code has not expired.
            const updateAttempts = await prisma.twoFA.updateMany({
                where: {
                    userId: userId,
                    attempts: {lt: 5},
                },
                data: {attempts: {increment: 1}}
            });

            //------- if count === 0, it means the 5-attempt limit has been reached or the code has expired.
            if (updateAttempts.count === 0){
                await prisma.twoFA.deleteMany({
                    where:{ userId: userId}
                });
                cookies.delete('twoFA', { path: '/' });
                return {
                    success: false, error: "Trop de tentatives erronées. Veuillez recommencer la connexion."}
            }

            //------- checks if the code entered by the user is the same as the one he must enter
            if (twoFA.code !== code) {
                return { success: false, error: "Code incorrect." };
            }

            //------- modify accountValidated in true because all good
            await prisma.user.update({
                where: { id: userId },
                data: { accountValidated: true }
            });

            //------- delete 2FA for user because validate
            await prisma.twoFA.delete
                ({
                    where: { userId: userId }
                });

            //------- clear expired sessions, save the new session in the database and set a secure 'session' cookie in the browser 
            await createSessionAndCookie(userId, cookies);

            //------- delete cookie 2FA
            cookies.delete('twoFA', { path: '/' });

            return { success: true };
        }

        catch (error) {
            return { success: false, error: "Erreur serveur." };
        }
    }
}

/**
 * @brief Check if user already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        throw redirect(303, '/home');
    }

    return {};
}
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';
import { isValidAuth } from '$lib/server/auth';

/**
 * @brief Checks the validity of the password reset link when the page is loaded
 * 
 * This server load function verifies that the user is not already logged in,
 * retrieves the password reset token form the URL, checks that the token exists
 * in the database, and verifies that is has not expired. 
 * 
 * @param url (URL) Used to retrieve the password reset token from the URL query parameters. 
 * @param cookies (Cookies) Used to check if the user already has an active session.
 * 
 * step 1 : check if user exists to go on /home page
 * 
 * step 2 : get the reset token 
 * - retrieve the 'token' parameter from the URL query string
 * - return an error if no token is provided
 * 
 * step 3 : validate the reset token
 * - check if the token exists in the Password database table
 * - return an error if the token does not exists
 * - check if the token expiration date had been reached
 * - delete the expired token from the database
 * - return an error message asking the user to generate a new reset link
 * 
 * step 4 : return success
 * - return the valid token so it can be used by the password reset form
 */
export const load: PageServerLoad = async ({ url, cookies, locals }) => {

    //------- check if user exists to go on /home page
    if (locals.user) {
        throw redirect(303, '/home');
    }

    //------- retrieve the 'token' parameter from the URL query string
    const token = url.searchParams.get('token');

    //------- return an error if no token is provided
    if (!token) {
        return { success: false, error: "Lien invalide." };
    }

    //------- check if the token exists in the Password database table
    const check = await prisma.passwordReset.findFirst({
        where: { token: token },
    });

    //------- return an error if the token does not exists
    if (!check) {
        return { success: false, error: "Ce lien de réinitialisation n'existe pas." };
    }

    //------- check if the token expiration date had been reached and delete the expired token from the database
    if (check.expiresAt < new Date(Date.now())) {
        await prisma.passwordReset.delete({ where: { token: token } });
        return { success: false, error: "Ce lien a expiré, veuillez générer un nouveau lien." };
    }

    //------- return the valid token so it can be used by the password reset form
    return { token };
}

/**
 * @brief Handles the password reset process.
 * This server action validates the password reset token, checks the new password and its confirmation,
 * verifies that the new password is different from the old one, hashes the new password,
 * updates the user's password, invalidates all active sessions and 2FA entries,
 * deletes the reset token via a transaction, and redirects the user to the welcome page.
 * 
 * @param request (Request) The incoming form data containing the new password,
 * password confirmation, and password reset token.
 * 
 * @returns Returns an error status object if validation fails or if an error occurs
 * during the password reset process.
 * 
 * step 1 : get the variables from form
 * - with request.formData();
 * - get the new password, password confirmation, and reset token from formData.
 * 
 * step 2 : validate the reset token
 * - check that the token exists and is a valid string.
 * - check if the token exists in the PasswordReset database table.
 * - return an error if the token does not exist.
 * - check if the token has expired.
 * - delete the expired token from the database.
 * - return an error asking the user to generate a new reset link.
 * 
 * step 3 : validate the new password
 * - check if the password and password confirmation are not empty.
 * - check that both password values are strings.
 * - check that the password and confirmation match.
 * - check that the password meets the minimum length requirement.
 * 
 * step 4 : database & security checks
 * - retrieve the user associated with the password reset token.
 * - return an error if the user cannot be found.
 * - compare the new password with the current hashed password.
 * - prevent the user from reusing the same password.
 * 
 * step 5 : secure atomic transaction update
 * - hash the new password using bcrypt.
 * - execute a Prisma transaction to:
 *   - update the user's password in the database with the new hashed password.
 *   - delete the password reset token from the PasswordReset database table.
 *   - clear any pending 2FA entries.
 *   - invalidate all active user sessions (forces logout everywhere).
 * 
 * step 6 : success
 * - redirect the user to the welcome page after successfully changing the password.
 * 
 * step 7 : error handling
 * - catch unexpected server errors.
 * - return a server error message if the password update fails.
 */
export const actions: Actions = {
    default: async ({ request }) => {

        //------- get the variables from form
        const formData = await request.formData();
        const password = formData.get('password') as string;
        const password_confirm = formData.get('password_confirm') as string;
        const token = formData.get('token');
 
        //------- check that the token exists and is a valid string
        if (!token || typeof token !== 'string') {
            return fail(400, { success: false, error: "token manquant." });
        }

        //------- check if the token exists in the PasswordReset database table
        const check = await prisma.passwordReset.findFirst({
            where: { token: token },
        });

        //------- return an error if the token does not exist
        if (!check) {
            return fail(400, { success: false, error: "Ce lien de réinitialisation n'existe pas." });

        }

        //------- check if the token has expired and delete the expired token from the database.
        if (check.expiresAt < new Date(Date.now())) {
            await prisma.passwordReset.deleteMany({ where: { token: token } });
            return fail(400, { success: false, error: "Ce lien a expiré, veuillez générer un nouveau lien." });
        }

        //------- check if the password and password confirmation are not empt
        if (!password || !password_confirm) {
            return fail(400, { success: false, error: "Au moins un element est vide !" });
        }

         //------- check length and format of variables
        let test: string = isValidAuth("", "", password, password_confirm);

        if (test)
            return fail(400, {success: false, error: test });

        try {
            //------- retrieve the user associated with the password reset token
            const user = await prisma.user.findUnique({
                where: { id: check.userId }
            });

            //------- return an error if the user cannot be found
            if (!user) {
                return fail(400, { success: false, error: "Utilisateur introuvable." });
            }

            //------- prevent the user from reusing the same password
            if (user.password) {
                const same = await bcrypt.compare(password, user.password);
                if (same) {
                    return fail(400, { success: false, error: "Le nouveau mot de passe doit être différent de l'ancien !" });
                }
            }

            //------- hash the new password using bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);

            //------- $transaction : Prisma takes the entire list, opens an SQL transaction, and applies everything at once. If a single row fails, Prisma rolls everything back.
            await prisma.$transaction([
                //-------  update the user's password in the database with the new hashed password
                prisma.user.update({
                    where: { id: check.userId },
                data: { password: hashedPassword },
                }),

                //------- delete the password reset token from the PasswordReset database table
                prisma.passwordReset.deleteMany({
                where: { token: token },
                }),

                //------- clear any pending 2FA entries.
                prisma.twoFA.deleteMany({
                    where: { userId: check.userId }
                }),

                //------- invalidate all active user sessions (forces logout everywhere)
                prisma.session.deleteMany({
                    where: { userId: check.userId}
                })
            ]);
         

            
        }
        catch (error) {
            return fail(500, { success: false, error: "Erreur server lors de la mise à jour du mot de passe." });
        }

        //------- redirect the user to the welcome page after successfully changing the password
        throw redirect(303, '/auth/welcome');
    }
}
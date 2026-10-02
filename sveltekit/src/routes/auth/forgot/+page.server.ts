import { prisma } from '$lib/server/prisma';
import { randomUUID } from 'crypto';
import { sendMail } from '$lib/server/email'
import { blockAuth } from '$lib/server/blockAuth';
import type { PageServerLoad } from './$types';
import { type Actions, fail } from '@sveltejs/kit';
import { isValidAuth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';


/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home.
 */
export const load: PageServerLoad = async ({ locals }) => {
    blockAuth(locals);
    return {};
}

/**
 * @brief Handles the forgot password process. 
 * This server action validates the user's email address, checks if the account exists, 
 * generates a secure password reset token, stores it in the database with an expiration date, 
 * and send a password reset link to the user's email. 
 * 
 * @param request (Request) The incoming form data containing the user's email address. 
 * 
 * step 1 : get the variables from form
 * - with request.formData();
 * - get the email from formData with formData.get('email');
 * 
 * step 2 : validate the email
 * - check if the email is not empty
 * - validate the email format using a regular expression
 * 
 * step 3 : databse & security 
 * - check if a user exists in the database with the provided email
 * - if the user exists, generate a secure unique password reset token using randomUUID()
 * - check if google account
 * - check if we already send a email, we don't want to spam
 * - upsert the password reset token in the PasswordReset databe table
 * - set the token expiration data to 15 minutes
 * - if a previous reset token already exists for the user, update it with a new token and expiration date
 * 
 * step 4 : send password reset email
 * - generate a password reset URL containing the reset token
 * - send the password reset lik to the user's email
 * 
 * step 5 : return success
 * - return a generic success message whether or not the email is associated with an existing account 
 * - this prevents revealing wheter an email address is registered in the application
 * 
 * step 6 : error handling
 * - catch unexpected server errors
 * - log the error for debugging purposes
 * - return a generic server error message to the client
 */
export const actions: Actions =
{
    default: async ({ request }) => {

        //------- get the variables from form
        const formData = await request.formData();
        const email = formData.get('email')?.toString().toLowerCase().trim() ?? '';

        //------- check if the email is not empty
        if (!email.trim()) {
            return { success: false, error: "Email manquant !" };
        }

        let test: string = isValidAuth("", email, "", "");

        if (test)
            return fail(400, { success: false, error: test });

        //------- use to wait before email send
        const startTime = Date.now();
        const minResponseTime = 500;

        try {
            //------- check if a user exists in the database with the provided email
            const existingUser = await prisma.user.findFirst
                ({
                    where: { email: email },
                });

            //------- if the user exists, generate a secure unique password reset token using randomUUID()
            if (existingUser) {

                //------- check if google account
                if (existingUser.password == null) {
                    return { success: false, error: "Si cet email est associé à un compte, un lien a été envoyé." };
                }

                //------- check if we already send a email, we don't want to spam
                const spam = await prisma.passwordReset.findFirst({
                    where: { userId: existingUser.id },
                });

                if (spam && (Date.now() - spam.createdAt.getTime()) < 60000) {
                    const elapsedTime = Date.now() - startTime;

                    if (elapsedTime < minResponseTime) {
                        await new Promise((resolve) => setTimeout(resolve, minResponseTime - elapsedTime));
                    }
                    return { success: true, msg: "Si cet email est associé à un compte, un lien a été envoyé." };
                }

                const token = randomUUID();

                //------- upsert the password reset token in the PasswordReset databe table
                await prisma.passwordReset.upsert
                    ({
                        where: { userId: existingUser.id },
                        update: {
                            token: token,
                            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                            createdAt: new Date()
                        },
                        create:
                        {
                            token: token,
                            userId: existingUser.id,
                            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                            createdAt: new Date()
                        }
                    });

                //------- generate a password reset URL containing the reset token
				const origin = env.ORIGIN ?? 'https://localhost:8443';
				const urlRestPassword = `${origin}/auth/resetPassword?token=${token}`;

                try {
                    //------- send the password reset lik to the user's email
                    await sendMail
                        (
                            existingUser.email,
                            "Lien pour changer votre mot de passe.",
                            "Cliquer ici pour changer votre mot de passe : " + urlRestPassword
                        );
                }
                catch (mailError) {
                    return { success: false, error: "Compte créé mais erreur lors de l'envoie du mail." };
                }

                //------- a little wait before to send email otherwise we can know if email exists

                const elapsedTime = Date.now() - startTime;

                if (elapsedTime < minResponseTime) {
                    await new Promise((resolve) => setTimeout(resolve, minResponseTime - elapsedTime));
                }

            }
            //------- return a generic success message whether or not the email is associated with an existing account 
            return { success: true, msg: "Si cet email est associé à un compte, un lien a été envoyé." };
        }

        //------- error handling
        catch (error) {
            return { success: false, error: "Erreur serveur." }
        }
    }
}

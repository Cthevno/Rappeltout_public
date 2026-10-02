import { prisma } from '$lib/server/prisma'; //to use prisma
import bcrypt from 'bcryptjs'; //protected password
import { randomInt, randomUUID } from 'crypto'; //to have a random session Id
import { sendMail } from '$lib/server/email';
import { blockAuth } from '$lib/server/blockAuth';
import type { PageServerLoad } from './$types';
import { type Actions, fail } from '@sveltejs/kit';
import { isValidAuth } from '$lib/server/auth';

/**
 * @brief Check if session already exist and if user click on previous, don't go back on auth page but stay in home
 */
export const load: PageServerLoad = async ({ locals }) => {
    blockAuth(locals);
    return {};
}

/**
 * @brief Handles connexion process.
 * * This server action verifies user credentials, validates the existence of the account, 
 * compares the hashed password, and initiates the 2FA process by generating 
 * a secure random token and 6-digit code, saving them to the database, and sending the code via email.
 * 
 * @param request (Request) The incoming form data containing login credentials.
 * @param cookies (Cookies) Used to set the temporary 'twoFA' cookie with a secure random token required for the validation step.
 * 
 * @returns Returns a status object indicating if the 2FA step is required or if an error occurred.
 * 
 * step 1 : get the variables from form 
 * - with request.formData();
 * - get email and password from formData with formData.get('//');
 * 
 * step 2 : all check
 * - check if email and password are not empty.
 * 
 * step 3 : database & security
 * - check if the user exists in the database by email.
 * - verify if the provided password matches the stored hashed password.
 * - (security) return a generic error message if email or password is incorrect.
 * 
 * step 4 : 2FA initiation
 * - generate a cryptographically secure random token and 6-digit code.
 * - set a temporary 'twoFA' cookie containing the secure token (no ID exposed) for the next step.
 * - upsert (update or create) the code, token, and expiration date in the TwoFA database table.
 * - send the generated code to the user via email.
 * - return success: true and requires2FA: true.
 */
export const actions: Actions =
{
    default: async ({ request, cookies }) => {

        //-------  variables with await
        const formData = await request.formData();
        const email = formData.get('email')?.toString().toLowerCase().trim() ?? '';
        const password = formData.get('password')?.toString() ?? '';

        //------- empty
        if (!email.trim() || !password.trim()) {
            return { success: false, error: "Email ou mot de passe manquant" };
        }

        let test: string = isValidAuth("", email, password, "");

        if (test)
            return fail(400, { success: false, error: test });

        try {
            //------- check if the user exists in the database by email
            const connectedUser = await prisma.user.findFirst
                ({
                    where: { email: email }
                });

            if (!connectedUser) {
                return { success: false, error: "Email ou mot de passe incorrect" };
            }

            if (connectedUser.password == null) {
                return { success: false, error: "Email ou mot de passe incorrect" };
            }

            //-------  verify if the provided password matches the stored hashed password.
            const comparePassword = await bcrypt.compare(password, connectedUser.password);

            if (!comparePassword) {
                return { success: false, error: "Email ou mot de passe incorrect" };
            }

            const token = randomUUID(); //random Id
            
            //------- set a temporary 'twoFA' cookie (with userId) for the next step
            cookies.set('twoFA', token,
                {
                    path: '/', // this cookie is valid for the entire site
                    httpOnly: true, // security : when true, the cookie is invisible to the JavaScript running in your browser.
                    sameSite: 'strict', // security : The cookie will only be sent to the server if the request comes from your own site
                    secure: true, // security : send cookie only if its https and not http
                    maxAge: 300 // cookie liftime
                }
            );

            //------- generate a cryptographically secure 6-digit code
            const code = randomInt(100000, 999999).toString();

            //------- upsert (update or create) the code and expiration date in the TwoFA database table
            await prisma.twoFA.upsert
                ({
                    where: { userId: connectedUser.id },
                    update:
                    {
                        code: code,
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        attempts: 0,
                        token: token
                    },
                    create:
                    {
                        userId: connectedUser.id,
                        code: code,
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        attempts: 0,
                        token: token
                    }
                });

            //------- send the generated code to the user via email
            await sendMail
                (
                    connectedUser.email,
                    "Votre code de sécurité",
                    "Votre code est : " + code
                );

            //------- return success
            return { success: true, requires2FA: true };
        }

        catch (error) {
            console.error("ERREUR LOGIN DÉTAILLÉE :", error);
            return { success: false, error: "Erreur serveur." };
        }
    }
}


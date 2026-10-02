import { prisma } from '$lib/server/prisma'; //to use prisma
import bcrypt from 'bcryptjs'; //protected password
import { sendMail } from '$lib/server/email';
import { randomInt, randomUUID } from 'crypto'; //to have a random session Id
import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isValidAuth } from '$lib/server/auth';

/**
 * @brief Handles the user registration process.
 * * This server action validates input fields, ensures data integrity (password match, 
 * email format, unique user constraints), hashes the password, saves the user to 
 * the database, and initiates the 2FA process with a secure random token cookie.
 * 
 * @param request (Request) The incoming form data containing user credentials.
 * @param cookies (Cookies) Used to set the secure temporary 'twoFA' cookie with a random token.
 * 
 * @returns Returns a status object indicating success or failure with a descriptive error message.
 * 
 * step 1 : get the variables from form 
 * - with request.formData();
 * - get username, email, password and password_confirm with formData.get('//');
 * 
 * step 2 : all check
 * - check if username, email, password and password_confirm are empty
 * - check if same password between password and password_confirm
 * - checks if the email is in the correct format
 * - check length of password
 * 
 * step 3 : database & 2FA initiation
 * - check if already exist in DB 
 * - check if pseudo or email are used else error
 * - encrypt password
 * - if don't exist, save in DB with accountValidated: false
 * - generate a cryptographically secure random token and 6-digit code
 * - set a secure temporary 'twoFA' cookie containing the random token (no ID exposed)
 * - upsert the code, token, and expiration in the TwoFA database table
 * 
 * step 4 : success
 * - send confirmation email containing the 2FA code
 * - return success : true and requires2FA : true
 */
export const actions: Actions =
{
    default: async ({ request, cookies }) => {

        //-------  get the variables from form 
        const formData = await request.formData();
        const username = formData.get('username')?.toString().trim().replace(/\s+/g, ' ') ?? '';
        const email = formData.get('email')?.toString().toLowerCase().trim() ?? '';
        const password = formData.get('password')?.toString() ?? '';
        const password_confirm = formData.get('password_confirm')?.toString() ?? '';

        //------- empty
        if (!username || !email || !password || !password_confirm) {
            return { success: false, error: "Au moins un element est vide !" };
        }

        //------- check length and format of variables
        let test: string = isValidAuth(username, email, password, password_confirm);

        if (test)
            return fail(400, { success: false, error: test });

        try {
            //------- delete all user who dont validated there account in time
            const mustDelete = await prisma.user.findMany({
                where: {
                    accountValidated: false,
                    twoFA: {
                        expiresAt: { lt: new Date() }
                    }
                },
                select: { id: true }
            });

            if (mustDelete.length > 0)
            {
                await prisma.user.deleteMany({
                    where : {
                        id : {in : mustDelete.map(u => u.id)}
                    }
                })
            }

            //------- check if already exist in DB 
            const existingUser = await prisma.user.findFirst
                ({
                    where:
                    {
                        OR:
                            [
                                { email: email },
                                { username: username }
                            ]
                    }
                });

            //------- check if pseudo or email are used
            if (existingUser) {
                if (existingUser.username == username) {
                    return { success: false, error: "Ce pseudo est déjà pris !" };
                }
                return { success: false, error: "Cet email existe déjà !" };
            }

            //------- crypted the password
            const hashedPassword = await bcrypt.hash(password, 10);

            //------- if don't exist, save in DB
            const newUser = await prisma.user.create
                ({
                    data:
                    {
                        username: username,
                        email: email,
                        password: hashedPassword,
                        accountValidated: false
                    }
                });

            //------- token to send in cookie 
            const token = randomUUID();

            //------- set a temporary 'twoFA' cookie (with token) for the next step
            cookies.set('twoFA', token,
                {
                    path: '/', // this cookie is valid for the entire site
                    httpOnly: true, // security : when true, the cookie is invisible to the JavaScript running in your browser.
                    sameSite: 'strict', // security : The cookie will only be sent to the server if the request comes from your own site
                    secure: true, // security : send cookie only if its https and not http
                    maxAge: 300, // cookie liftime
                }
            );

            //------- generate a cryptographically secure 6-digit code
            const code = randomInt(100000, 999999).toString();

            //------- upsert (update or create) the code and expiration date in the TwoFA database table
            await prisma.twoFA.upsert
                ({
                    where: { userId: newUser.id },
                    update:
                    {
                        code: code,
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        attempts: 0,
                        token: token
                    },
                    create:
                    {
                        userId: newUser.id,
                        code: code,
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        attempts: 0,
                        token: token
                    }
                });

            try {
                //------- send the generated code to the user via email
                await sendMail
                    (
                        newUser.email,
                        "Bienvenue sur Rappeltout : Votre code de sécurité",
                        "Votre compte a été créé avec succès.\nVotre code est : " + code
                    );
                }
            catch (mailError) {
                console.error("Error sending welcome email");
            }

            return { success: true, requires2FA: true };
        }

        catch (error) {
            console.error("ERREUR INSCRIPTION DÉTAILLÉE :", error);
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

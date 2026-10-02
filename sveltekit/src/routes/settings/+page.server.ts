import { prisma } from '$lib/server/prisma'; //to use prisma
import bcrypt from 'bcryptjs'; //protected password
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { userHasHouse } from "$lib/server/house.js";
import { create_notification } from '$lib/server/notification';
import { isUsernameFormatValid } from "../../routes/auth/auth_validation";

/**
 * @brief Loads user settings data for the settings page.
 *
 * This server load function checks if the user is authenticated via request locals,
 * fetches their latest database record to verify account details (such as whether
 * they use an external Google login or a standard password), and returns user details
 * or empty defaults if unauthenticated.
 * 
 * @param locals (App.Locals) The request locals containing the current authenticated user context.
 * 
 * @returns Returns user profile data (email, username, isGoogleUser status) or empty fields.
 *
 * step 1 : check authentication
 * - check if an authenticated user exists in `locals.user`.
 * - return default empty strings if no user is connected.
 *
 * step 2 : fetch user details from database
 * - query the database using the user's email to get specific attributes (like password status).
 *
 * step 3 : return structured data
 * - return user email, username, and a boolean `isGoogleUser` indicating if the account has no local password.
 */
export const load: PageServerLoad = async ({ locals }) => {

    //------- check if an authenticated user exists in `locals.user`
    if (locals.user) {

        //------- query the database using the user's email to get specific attributes (like password status)
        const user = await prisma.user.findFirst({
            where: { email: locals.user.email },
        });

        let already_house: boolean = user?.id ? await userHasHouse(user.id) : false;

        //------- return user email, username, and a boolean `isGoogleUser` indicating if the account has no local password
        return {
            already_house,
            user:
            {
                email: locals.user.email,
                username: locals.user.username,
                isGoogleUser: user?.password == null
            },
            seo: { title: "Paramètres - Rappeltout" }
        };
    }

    //------- return default empty strings if no user is connected
    return {

        email: '',
        username: '',
        seo: { title: "Paramètres - Rappeltout" }
    }
}

/**
 * @brief Handles user settings updates and account deletion.
 *
 * This module defines SvelteKit server actions for modifying user profile information
 * (such as username and password changes with validation) and securely deleting the
 * user account along with its active sessions and associated household data.
 *
 * @param request (Request) The incoming form data containing updated user settings.
 * @param cookies (Cookies) Used to manage session cookies during account updates and account deletion.
 * @param locals (App.Locals) The current request context containing the authenticated user.
 *
 * @returns Returns a status object indicating success/failure with descriptive error messages or redirects.
 *
 * step 1 : updateInfos action - process profile updates
 * - extract form inputs (username, password fields) and sanitize whitespace.
 * - check length of password and username fields.
 * - validate and check uniqueness constraints for the username if changed.
 * - verify current password, validate new password constraints (length, confirmation match, difference from old password) if a password change is requested.
 * - update the user database record with the new username and/or newly hashed password.
 * - invalidate and delete all other active user sessions if a password change occurs, keeping only the current session token.
 *
 * step 2 : deleteAccount action - purge account, sessions, and household safely
 * - verify user authentication via request locals.
 * - check if the user is a headmaster (`creatorId`) of a household with other members; block deletion if transfer is required.
 * - use a Prisma transaction (`prisma.$transaction`) to atomically delete the single-member household (if applicable), the current session record, and the user record.
 * - clear the session cookie from the client browser and redirect to the welcome page.
 */
export const actions = {
    updateInfos: async ({ request, locals, cookies }: RequestEvent) => {

        if (!locals.user)
            throw redirect(303, '/auth/emailConnexion');

        const formData = await request.formData();
        const formUsername = ((formData.get('username') as string) || '').trim().replace(/\s+/g, ' ');
        const formPassword = (formData.get('password') as string) || '';
        const formNewPassword = (formData.get('new_password') as string) || '';
        const formPasswordConfirm = (formData.get('password_confirm') as string) || '';

        //------- check length of password and username
        if (formUsername.length > 20) {
            return fail(400, { success: false, errorUsername: "Le pseudo ne peut pas dépasser 20 caractères !" });
        }

        if (!formUsername) {
            return fail(400, { success: false, errorUsername: "Le pseudo ne peut pas être vide!" });
        }

        if (formUsername.length < 2) {
            return fail(400, { success: false, errorUsername: "Le pseudo est trop court !" });
        }

        if (formUsername !== "" && !isUsernameFormatValid(formUsername))
            return fail(400, { success: false, errorUsername: "Le pseudo ne peut contenir que des lettres, chiffres, tirets, point, le caractère plus et underscores." });

        if (formPassword.length > 50 || formNewPassword.length > 50 || formPasswordConfirm.length > 50) {
            return fail(400, { success: false, errorPassword: "Le mot de passe est trop long !" });
        }

        const user = await prisma.user.findFirst({
            where: { email: locals.user.email },
        });

        if (user) {
            const userUsername = user?.username;
            const userPassword = user?.password;
            let hashedPassword = null;

            const isPasswordChanged = formNewPassword.length > 0 || formPasswordConfirm.length > 0 ||
                formPassword.length > 0;
            const isPseudoChanged = locals.user.username !== formUsername;

            if (!isPseudoChanged && !isPasswordChanged) {
                return fail(400, { success: false, errorChanged: "Aucune modification détectée." });
            }

            if (isPseudoChanged) {
                //------- username is empty
                if (!formUsername) {
                    return fail(400, { success: false, errorUsername: "Le pseudo ne peut pas être vide!" });
                }

                //------- search user in database
                const existingUsername = await prisma.user.findFirst({
                    where: { username: formUsername }
                });

                //------- username already exists
                if (existingUsername && existingUsername.username === formUsername)
                    return fail(400, { success: false, errorUsername: "Ce pseudo est déjà pris !" });
            }

            if (isPasswordChanged) {

                if (!userPassword)
                    return fail(400, { success: false, errorPassword: "Les comptes Google ne peuvent pas modifier leur mot de passe car ils n'ont pas de mot de passe !" });

                if (!formPassword)
                    return fail(400, { success: false, errorPassword: "Mot de passe actuel requis !" });

                //------- compare the password with what is written in the form
                const isPasswordValid = await bcrypt.compare(formPassword, userPassword as string);
                if (!isPasswordValid)
                    return fail(400, { success: false, errorPassword: "Mot de passe actuel incorrect !" });

                //------- check the password length.
                if (formNewPassword.length < 8)
                    return fail(400, { success: false, errorPassword: "Le mot de passe doit contenir plus de 7 caractères !" });

                //------- compare the new password and the confirmation
                if (formNewPassword !== formPasswordConfirm)
                    return fail(400, { success: false, errorPassword: "Les mots de passe ne correspondent pas !" });

                const isSame = await bcrypt.compare(formNewPassword, userPassword as string);
                if (isSame)
                    return fail(400, { success: false, errorPassword: "Le nouveau mot de passe doit être différent de l'actuel !" });

                hashedPassword = await bcrypt.hash(formNewPassword, 10);
            }

            //------- update database
            if (hashedPassword === null) {
                await prisma.user.update({
                    where: { email: user.email },
                    data: {
                        username: formUsername,
                    },
                });
            }
            else {
                await prisma.user.update({
                    where: { email: user.email },
                    data: {
                        username: formUsername,
                        password: hashedPassword,
                    },
                });
                
                //------- delete other active session
                const actualSession = cookies.get('session');
                if (actualSession) {
                    await prisma.session.deleteMany({
                        where: {
                            userId: user.id,
                            id: { not : actualSession }
                        }
                    });
                }
            }

        }

        return {
            success: true, user:
            {
                email: locals.user.email,
                username: formUsername,
            }
        };
    },

    deleteAccount: async ({ cookies, locals }: RequestEvent) => {

        if (!locals.user)
            return fail(401, { success: false, error: "Non autorisé." });
        // A HEADMASTER must transfer the household before deleting the account.
        const headed_house = await prisma.house.findFirst({
            where: {
                creatorId: locals.user.id
            },
            include: {
                members: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (headed_house && headed_house.members.length > 1) {
            return fail(403, {
                success: false,
                error: "Tu dois d’abord transférer la direction de ton foyer avant de supprimer ton compte."
            });
        }

        if (headed_house && headed_house.members.length === 1) {
            await prisma.house.delete({
                where: {
                    code: headed_house.code
                }
            });
            const joined_house = await prisma.house.findFirst({
                where: {
                    members: {
                        some: { id: locals.user.id }
                    }
                },
                include: {
                    members: {
                        select: {
                            id: true
                        }
                    }
                }
            });
        }
        let joined_house = null;

        if (!headed_house) {
            joined_house = await prisma.house.findFirst({
                where: {
                    members: {
                        some: { id: locals.user.id }
                    }
                },
                include: {
                    members: {
                        select: {
                            id: true
                        }
                    }
                }
            });
        }
        //------- retrieve the 'session' cookie from the user's browser
        const sessionToken = cookies.get('session');

        try {
            //------- if a session token exists, remove the corresponding session from the database to invalidate it server-side
            if (sessionToken) {
                await prisma.session.deleteMany({
                    where: { id: sessionToken }
                });
            }

            //------- remove the 'session' cookie from the browser (clearing the path '/')
            cookies.delete('session', { path: '/' });

            await prisma.user.delete({
                where: { id: locals.user.id }
            });
            if (joined_house && !headed_house) {
                for (const member of joined_house.members) {
                    if (member.id === locals.user.id)
                        continue;

                    await create_notification(
                        member.id,
                        'INVITATION',
                        'Un membre a quitté le foyer',
                        `${locals.user.username} a quitté le foyer.`,
                        '/house'
                    );
                }
            }
        }
        catch (error) {
            return { success: false, error: "Erreur server." };
        }

        //------- redirect the user to the welcome page ('/auth/welcome')
        throw (redirect(303, '/auth/welcome'));

    }
}



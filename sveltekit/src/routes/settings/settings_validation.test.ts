import { describe, it, expect } from 'vitest';
import { settingsTest } from './settings_validation';

/**
 * ===================================
 * UNIT TESTS
 * ===================================
 */
describe('settingsTest', () => {
    it('return error if username is to short', () => {
        expect(settingsTest('a', '', '', '')).toBe("Le pseudo est trop court !");
        expect(settingsTest('1', '', '', '')).toBe("Le pseudo est trop court !");

    });
    it('return error if username is to long', () => {
        expect(settingsTest('012345678901234567890', '', '', '')).toBe("Le pseudo ne peut pas dépasser 20 caractères !");
        expect(settingsTest('abcdefghijklmnopqrstuvwxyz', '', '', '')).toBe("Le pseudo ne peut pas dépasser 20 caractères !");

    });
    it('return error if password is to long', () => {
        expect(settingsTest('test', 'a'.repeat(51), '', '')).toBe("Le mot de passe est trop long !");
        expect(settingsTest('test', '1'.repeat(51), '', '')).toBe("Le mot de passe est trop long !");
    });
    it('return error if new password is to long', () => {
        expect(settingsTest('test', '', 'a'.repeat(51), '')).toBe("Le mot de passe est trop long !");
        expect(settingsTest('test', '', '1'.repeat(51), '')).toBe("Le mot de passe est trop long !");
    });
    it('return error if new password is to long', () => {
        expect(settingsTest('test', '', '', 'a'.repeat(51))).toBe("Le mot de passe est trop long !");
        expect(settingsTest('test', '', '', '1'.repeat(51))).toBe("Le mot de passe est trop long !");
    });
})

/**
 * ===================================
 * BACK-END TEST ACTIONS UPDATEINFOS
 * ===================================
 */

import { actions as settingsActions } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs';
import { create_notification } from '$lib/server/notification';

//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        house: {
            findFirst: vi.fn(),
            delete: vi.fn()
        },
        session: {
            deleteMany: vi.fn()
        }
    },
}));

vi.mock('$lib/server/notification', () => ({
    create_notification: vi.fn()
}));

vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn().mockResolvedValue('hashed_new_password')
    }
}));

describe('Settings UpdateInfos Level 2 Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        //------- Default mock for prisma.user.findFirst
        (prisma.user.findFirst as any).mockImplementation(async (args: any) => {
            //------- Return null if checking username availability
            if (args?.where?.username === 'mlaussel2' && args?.where?.NOT) {
                return { id: 2, username: 'mlaussel2' };
            }
            //------- Otherwise, return the current logged-in user details
            return {
                id: 1,
                email: 'test@hotmail.fr',
                username: 'mlaussel',
                password: '12345678'
            };
        });
    });

    const submitSettingsForm = async (formUsername: string, formPassword?: string, formNewPassword?: string, formPasswordConfirm?: string) => {

        //------- simulate form with bad code
        const formData = new FormData();
        formData.append('username', formUsername);
        if (formPassword)
            formData.append('password', formPassword);
        if (formNewPassword)
            formData.append('new_password', formNewPassword);
        if (formPasswordConfirm)
            formData.append('password_confirm', formPasswordConfirm);

        //------- simulate HTTP request
        const request = new Request('http://localhost:8443/auth/create', {
            method: 'POST',
            body: formData
        });

        //------- simulate user in locals
        const locals = { user: { id: 1, email: 'test@gmail.com', username: 'mlaussel' } };

        //------- executate actions
        return await settingsActions.updateInfos({
            request,
            locals
        } as any);

    }

    /**
    * ===================================
    * USERNAME LONGER
    * ===================================
    */
    it('return error when username is longer', async () => {

        const result = await submitSettingsForm('t'.repeat(21));

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorUsername: "Le pseudo ne peut pas dépasser 20 caractères !"
            }
        });

    });

    /**
     * ===================================
     * USERNAME SHORTER
     * ===================================
     */
    it('return username when email is shorter', async () => {

        const result = await submitSettingsForm('t');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorUsername: "Le pseudo est trop court !"
            }
        });

    });

    /**
    * ===================================
    * PASSWORDS LONGER
    * ===================================
    */
    it.each([
        ['password too long', 'a'.repeat(51), '', ''],
        ['new password too long', '', 'a'.repeat(51), ''],
        ['confirm password too long', '', '', 'a'.repeat(51)],
    ])
        ('return error when %s', async (_, password, password_new, password_confirm) => {
            const result = await submitSettingsForm('mlaussel', password, password_new, password_confirm);

            //------- check actions send back error
            expect(result).toEqual({
                status: 400,
                data: {
                    success: false,
                    errorPassword: "Le mot de passe est trop long !"
                }
            });
        });

    /**
    * ===================================
    * NO MODIFICATION
    * ===================================
    */
    it('return error when no modification', async () => {

        const result = await submitSettingsForm('mlaussel');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorChanged: "Aucune modification détectée."
            }
        });
    });

    /**
    * ===================================
    * USERNAME EMPTY
    * ===================================
    */
    it('return error when username is empty', async () => {

        const result = await submitSettingsForm('');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorUsername: "Le pseudo ne peut pas être vide!"
            }
        });
    });

    /**
    * ===================================
    * PSEUDO ALREADY USED
    * ===================================
    */
    it('return error when username is already use', async () => {

        //------- simulate username already exists in DB
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test2@hotmail.fr',
            username: 'mlaussel2'
        });

        const result = await submitSettingsForm('mlaussel2');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorUsername: "Ce pseudo est déjà pris !"
            }
        });
    });

    /**
    * =========================================
    * INCORRECT PASSWORD
    * =========================================
    */
    it('return error when password is incorrect', async () => {

        //------- simulate user in DB to test password
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            username: 'mlaussel',
            password: '12345678'
        });

        //------- bcrypt.compare returns false for bad password
        (bcrypt.compare as any).mockResolvedValue(false);

        const result = await submitSettingsForm('mlaussel', '12345679');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorPassword: "Mot de passe actuel incorrect !"
            }
        });
    });

    /**
    * =========================================
    * ACTUAL PASSWORD REQUIRED
    * =========================================
    */
    it('return error when current password is required but missing', async () => {

        const result = await submitSettingsForm('mlaussel', '', '123456789', '123456789');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorPassword: "Mot de passe actuel requis !"
            }
        });
    });


    /**
    * ===================================
    * NEW PASSWORD SHORTER
    * ===================================
    */
    it('return error when new passwors is shortet', async () => {

        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            username: 'mlaussel',
            password: '12345678'
        });

        //------- check that first password is good
        (bcrypt.compare as any).mockResolvedValueOnce(true).mockResolvedValueOnce(true);

        const result = await submitSettingsForm('mlaussel', '12345678', '12');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorPassword: "Le mot de passe doit contenir plus de 7 caractères !"
            }
        });
    });

    /**
    * ======================================================
    * NO MATCHING BETWEEN NEW PASSWORD AND PASSWORD CONFIRM
    * ======================================================
    */
    it('return error when new passwors is shortet', async () => {

        const result = await submitSettingsForm('mlaussel', '12345678', '123456789', '123456780');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorPassword: "Les mots de passe ne correspondent pas !"
            }
        });
    });

    /**
    * ========================================
    * NEW PASSWORD IS THE SAME THAT THE OLDER
    * ========================================
    */
    it('return error when new password is the same that the older', async () => {

        //------- simulate user in DB to test password
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            username: 'mlaussel',
            password: '12345678'
        });

        //------- bcrypt.compare returns false for bad password
        (bcrypt.compare as any).mockResolvedValue(true);

        const result = await submitSettingsForm('mlaussel', '12345678', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            status: 400,
            data:
            {
                success: false,
                errorPassword: "Le nouveau mot de passe doit être différent de l'actuel !"
            }
        });
    });

    /**
    * ===================================
    * ALL GOOD
    * ===================================
    */
    it('success', async () => {

        //------- simulate user in DB to test password
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            username: 'mlaussel',
            password: '12345678'
        });

        (prisma.user.update as any).mockResolvedValue({
            id: 1,
            username: 'mlaussel2'
        });

        const result = await submitSettingsForm('mlaussel2');

        //------- check actions send back error
        expect(result).toEqual({
            success: true,
            user:
            {
                email: 'test@gmail.com',
                username: 'mlaussel2'
            }
        });
    });

});

/**
 * ===================================
 * BACK-END TEST ACTIONS DELETEACCOUNT
 * ===================================
 */

describe('Delete Account Tests', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('1'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    /**
     * ===================================
     * NOT LOG
     * ===================================
     */
    it('return error when deleting account without being logged in', async () => {
        const result = await settingsActions.deleteAccount({
            locals: { user: null },
            cookies: fakeCookie
        } as any);

        expect(result).toEqual({
            status: 401,
            data: { success: false, error: "Non autorisé." }
        });
    });

    /**
     * ===================================
     * DELETE ACCOUNT
     * ===================================
     */
    it("refuses account deletion when the user is HEADMASTER of a household", async () => {
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });

        const result = await settingsActions.deleteAccount({
            locals: {
                user: { id: 1 }
            },
            cookies: fakeCookie
        } as any);

        expect(result).toEqual({
            status: 403,
            data: {
                success: false,
                error: "Tu dois d’abord transférer la direction de ton foyer avant de supprimer ton compte."
            }
        });

        expect(prisma.user.delete).not.toHaveBeenCalled();
        expect(prisma.session.deleteMany).not.toHaveBeenCalled();
        expect(fakeCookie.delete).not.toHaveBeenCalled();
    });
    it("allows HEADMASTER to delete the account when alone in the household", async () => {
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [
                { id: 1 }
            ]
        });

        (prisma.house.delete as any).mockResolvedValue({});
        (prisma.session.deleteMany as any).mockResolvedValue({});
        (prisma.user.delete as any).mockResolvedValue({});

        const error = await settingsActions.deleteAccount({
            locals: {
                user: { id: 1 }
            },
            cookies: fakeCookie
        } as any).catch((e) => e);

        expect(prisma.house.delete).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" }
        });

        expect(prisma.user.delete).toHaveBeenCalledWith({
            where: { id: 1 }
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith(
            "session",
            { path: "/" }
        );

        expect(error.location).toBe("/auth/welcome");
    });
    it('success when deleting account and redirecting', async () => {
        (prisma.house.findFirst as any).mockResolvedValue(null);
        (prisma.session.deleteMany as any).mockResolvedValue({});
        (prisma.user.delete as any).mockResolvedValue({});

        // simulate delete user and cookie and check if redirect exists with catch an error
        const error = await settingsActions.deleteAccount({
            locals: { user: { id: 1 } },
            cookies: fakeCookie
        } as any).catch((e) => e);

        // check clean session, cookies deleted and clean DB
        expect(fakeCookie.delete).toHaveBeenCalledWith('session', { path: '/' });
        expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: '1' } });
        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });

        // check redirect after delete
        expect(error.location).toBe('/auth/welcome');
    });
    it("notifies remaining household members when a user deletes their account", async () => {
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                code: "LUMOS-42",
                members: [
                    { id: 1 },
                    { id: 2 },
                    { id: 3 }
                ]
            });

        (prisma.user.delete as any).mockResolvedValue({});

        await settingsActions.deleteAccount({
            locals: {
                user: {
                    id: 2,
                    username: "Hermione"
                }
            },
            cookies: fakeCookie
        } as any).catch((e) => e);

        // Notifies the remaining household members after account deletion.
        expect(create_notification).toHaveBeenCalledTimes(2);

        for (const userId of [1, 3]) {
            expect(create_notification).toHaveBeenCalledWith(
                userId,
                'INVITATION',
                'Un membre a quitté le foyer',
                'Hermione a quitté le foyer.',
                '/house'
            );
        }
    });
});
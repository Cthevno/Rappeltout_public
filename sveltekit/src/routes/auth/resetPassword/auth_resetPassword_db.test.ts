import { load, actions } from './+page.server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn()
    }
}));

//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        passwordReset: {
            findFirst: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn()
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn()
        },
        twoFA: {
            deleteMany: vi.fn()
        },
        session: {
            deleteMany: vi.fn()
        },
        $transaction: vi.fn()
    }
}));

describe('Password Reset Page & Actions Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * ===================================
     * ALREADY CONNECTED
     * ===================================
     */
    it('load should redirect if user is already logged in', async () => {
        //------- simulate user already logged in via locals
        const fakeLocals = { user: { id: 1 } };
        const fakeUrl = new URL('https://localhost:8443/auth/reset?token=abc');

        //------- expect redirect to home page
        await expect(
            load({
                url: fakeUrl,
                cookies: {} as any,
                locals: fakeLocals
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: '/home'
        });
    });

    /**
     * ===================================
     * NO TOKEN
     * ===================================
     */
    it('load should return error if no token is provided', async () => {
        //------- URL without token parameter
        const fakeUrl = new URL('https://localhost:8443/auth/reset');

        const result = await load({
            url: fakeUrl,
            cookies: {} as any,
            locals: {}
        } as any);

        expect(result).toEqual({ success: false, error: "Lien invalide." });
    });

    /**
     * ===================================
     * NO TOKEN IN DB
     * ===================================
     */
    it('load should return error if token does not exist in db', async () => {
        //------- simulate token not found in database
        (prisma.passwordReset.findFirst as any).mockResolvedValue(null);
        const fakeUrl = new URL('https://localhost:8443/auth/reset?token=invalid_token');

        const result = await load({
            url: fakeUrl,
            cookies: {} as any,
            locals: {}
        } as any);

        expect(result).toEqual({ success: false, error: "Ce lien de réinitialisation n'existe pas." });
    });

    /**
     * ===================================
     * EXPIRED TOKEN IN LOAD
     * ===================================
     */
    it('load should return error if token is expired', async () => {
        //------- set past expiration date (1 hour ago)
        const pastDate = new Date(Date.now() - 3600000);
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'expired_token',
            expiresAt: pastDate
        });

        const fakeUrl = new URL('https://localhost:8443/auth/reset?token=expired_token');

        const result = await load({
            url: fakeUrl,
            cookies: {} as any,
            locals: {}
        } as any);

        //------- expect error message and token deletion
        expect(result).toEqual({ success: false, error: "Ce lien a expiré, veuillez générer un nouveau lien." });
        expect(prisma.passwordReset.delete).toHaveBeenCalledWith({ where: { token: 'expired_token' } });
    });

    /**
     * ===================================
     * ALL GOOD FOR LOAD
     * ===================================
     */
    it('load should return success with token if everything is valid', async () => {
        //------- set future expiration date for the token
        const futureDate = new Date(Date.now() + 3600000);
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: futureDate
        });

        const fakeUrl = new URL('https://localhost:8443/auth/reset?token=valid_token');

        const result = await load({
            url: fakeUrl,
            cookies: {} as any,
            locals: {}
        } as any);

        expect(result).toEqual({ token: 'valid_token' });
    });

    /**
     * ===================================
     * NO TOKEN IN FORM
     * ===================================
     */
    it('action should fail if token is missing in form', async () => {
        //------- create form data without token
        const formData = new FormData();
        formData.append('password', 'new_password123');
        formData.append('password_confirm', 'new_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "token manquant." }
        });
    });

    /**
     * ===================================
     * TOKEN NOT FOUND IN DB FOR ACTION
     * ===================================
     */
    it('action should fail if token does not exist in db', async () => {
        const formData = new FormData();
        formData.append('token', 'unknown_token');
        formData.append('password', 'new_password123');
        formData.append('password_confirm', 'new_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        //------- simulate token not found in database
        (prisma.passwordReset.findFirst as any).mockResolvedValue(null);

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Ce lien de réinitialisation n'existe pas." }
        });
    });

    /**
     * ===================================
     * EXPIRED TOKEN IN ACTION
     * ===================================
     */
    it('action should fail if token is expired', async () => {
        const formData = new FormData();
        formData.append('token', 'expired_token');
        formData.append('password', 'new_secure_password123');
        formData.append('password_confirm', 'new_secure_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        //------- simulate expired token in database
        const pastDate = new Date(Date.now() - 3600000);
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'expired_token',
            expiresAt: pastDate,
            userId: 1
        });

        const result = await actions.default({
            request: fakeRequest
        } as any);

        //------- expect failure due to expiration and token cleanup
        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Ce lien a expiré, veuillez générer un nouveau lien." }
        });
        expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { token: 'expired_token' } });
    });

    /**
     * ===================================
     * EMPTY FIELDS IN ACTION
     * ===================================
     */
    it('action should fail if password fields are empty', async () => {
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', '');
        formData.append('password_confirm', '');

        const fakeRequest = {
            formData: async () => formData
        };

        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 1
        });

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Au moins un element est vide !" }
        });
    });

    /**
     * ===================================
     * PASSWORDS DO NOT MATCH
     * ===================================
     */
    it('action should fail if passwords do not match', async () => {
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', 'new_password123');
        formData.append('password_confirm', 'different_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 1
        });

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Les mots de passe ne correspondent pas !" }
        });
    });

    /**
     * ===================================
     * PASSWORD SHORTER
     * ===================================
     */
    it('action should fail if password is too short', async () => {
        //------- create form data with short password
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', '123');
        formData.append('password_confirm', '123');

        const fakeRequest = {
            formData: async () => formData
        };

        //------- mock database to return a valid token check
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 1
        });

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Le mot de passe doit contenir plus de 7 caractères !" }
        });
    });

    /**
     * ===================================
     * PASSWORD TOO LONG
     * ===================================
     */
    it('action should fail if password is too long', async () => {
        const longPassword = 'a'.repeat(51);
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', longPassword);
        formData.append('password_confirm', longPassword);

        const fakeRequest = {
            formData: async () => formData
        };

        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 1
        });

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Mot de passe trop long !" }
        });
    });

    /**
     * ===================================
     * USER NOT FOUND IN ACTION
     * ===================================
     */
    it('action should fail if user associated with token is not found', async () => {
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', 'new_secure_password123');
        formData.append('password_confirm', 'new_secure_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 999
        });

        //------- simulate user not found in database
        (prisma.user.findUnique as any).mockResolvedValue(null);

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Utilisateur introuvable." }
        });
    });

    /**
     * ===================================
     * SAME PASSWORD
     * ===================================
     */
    it('action should fail if user used the same password', async () => {
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', 'new_secure_password123');
        formData.append('password_confirm', 'new_secure_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 999
        });

        //------- simulate user not found in database
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 1,
            password: 'hashed'
        });

        (bcrypt.compare as any).mockResolvedValue(true);

        const result = await actions.default({
            request: fakeRequest
        } as any);

        expect(result).toMatchObject({
            status: 400,
            data: { success: false, error: "Le nouveau mot de passe doit être différent de l'ancien !" }
        });
    });

    /**
     * ===================================
     * ALL GOOD FOR ACTIONS
     * ===================================
     */
    it('action should successfully update password and redirect', async () => {
        //------- create form data with valid fields
        const formData = new FormData();
        formData.append('token', 'valid_token');
        formData.append('password', 'new_secure_password123');
        formData.append('password_confirm', 'new_secure_password123');

        const fakeRequest = {
            formData: async () => formData
        };

        //------- simulate good token in database
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            token: 'valid_token',
            expiresAt: new Date(Date.now() + 3600000),
            userId: 1
        });

        //------- simulate existing user in database
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 1,
            password: '$2a$10$old_hashed_password'
        });

        (bcrypt.compare as any).mockResolvedValue(false);
        
        await expect(
            actions.default({
                request: fakeRequest
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });

        //------- verify database update and token deletion actions occurred
        expect(prisma.user.update).toHaveBeenCalled();
        expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({
            where: { token: 'valid_token' }
        });
        expect(prisma.twoFA.deleteMany).toHaveBeenCalled();
        expect(prisma.session.deleteMany).toHaveBeenCalled();
    });

});
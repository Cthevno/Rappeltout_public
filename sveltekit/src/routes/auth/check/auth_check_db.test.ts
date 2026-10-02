import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/session', () => ({
    cleanExpiredSessions: vi.fn().mockResolvedValue(undefined),
    createSessionAndCookie: vi.fn().mockImplementation(async (userId, cookies) => {
        cookies.set('session', 'fake_generated_token', { path: '/', httpOnly: true, secure: true });
    })
}));

//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        twoFA: {
            findUnique: vi.fn(),
            delete: vi.fn().mockResolvedValue(true),
            update: vi.fn().mockResolvedValue(true),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            deleteMany: vi.fn().mockResolvedValue({ count: 1 })
        },
        session: {
            create: vi.fn().mockResolvedValue(true)
        },
        user: {
            update: vi.fn().mockResolvedValue(true),
        }
    },
}));

import { load } from './+page.server';

describe('Check Test Load', () => {

    it('should redirect to home when user is already connected', async () => {
        const event = {
            locals: { user: { id: 1, username: 'test' } }
        };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/home'
        });
    });

    it('should return empty object when user is not connected', async () => {
        const event = {
            locals: { user: null }
        };

        const result = await load(event as any);

        expect(result).toEqual({});
    });

});

import { actions as checkActions } from './+page.server';
import { prisma } from '$lib/server/prisma';

describe('Auth Level 2 Tests - 2FA Verifications', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('1'),
            set: vi.fn(),
            delete: vi.fn()
        };

        //------- simulate DB
        (prisma.twoFA.findUnique as any).mockResolvedValue({
            userId: 1,
            code: '999999',
            expiresAt: new Date(Date.now() + 10000)
        });
    });

    const submit2FACheckCode = async (codeForm: string) => {
        //------- simulate form with bad code
        const formData = new FormData();
        formData.append('code', codeForm);

        //------- simulate HTTP request
        const request = new Request('http://localhost:8443/auth/check', {
            method: 'POST',
            body: formData
        });

        //------- executate actions
        return await checkActions.default({
            request,
            cookies: fakeCookie as any
        } as any);

    }

    /**
     * ===================================
     * BAD CODE
     * ===================================
     */
    it('return error when bad code', async () => {

        const result = await submit2FACheckCode('123456');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Code incorrect."
        });

    });

    /**
     * ===================================
     * GOOD CODE
     * ===================================
     */
    it('return no error good code', async () => {

        const result = await submit2FACheckCode('999999');

        //------- check actions send back error
        expect(result).toEqual({
            success: true,
        });

        expect(fakeCookie.set).toHaveBeenCalledWith(
            'session',
            expect.any(String),
            expect.objectContaining({ path: '/', httpOnly: true, secure: true })
        );

        expect(fakeCookie.delete).toHaveBeenCalledWith(
            'twoFA',
            { path: '/' }
        );
    });

    /**
     * ===================================
     * EMPTY CODE
     * ===================================
     */
    it('return error when code is empty', async () => {

        const result = await submit2FACheckCode('');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le code de vérification ne peut pas être vide."
        });
    });

    /**
     * ===================================
     * CODE SHORTER
     * ===================================
     */
    it('return error when code is shorter', async () => {

        const result = await submit2FACheckCode('123');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le code n'est pas de la bonne longueur."
        });
    });

    /**
     * ===================================
     * CODE LONGER
     * ===================================
     */
    it('return error when code is longer', async () => {

        const result = await submit2FACheckCode('1234567');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le code n'est pas de la bonne longueur."
        });
    });

    /**
     * ===================================
     * COOKIE 2FA DOESN'T EXIST
     * ===================================
     */
    it('return error when cookie 2FA not exist', async () => {

        //------- no cookie
        fakeCookie.get.mockReturnValue(undefined);

        //------- check actions send back error
        await expect(submit2FACheckCode('999999')).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });
    });

    /**
     * ===================================
     * INVALID COOKIE
     * ===================================
     */
    it('return error when id cookie is invalid', async () => {

        //------- invalid cookie token
        fakeCookie.get.mockReturnValue('abcd');

        //------- simulate DB returning nothing for this invalid token
        (prisma.twoFA.findUnique as any).mockResolvedValue(null);

        const result = await submit2FACheckCode('999999');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Session expirée, veuillez vous reconnecter."
        });
    });

    /**
     * ===================================
     * EXPERIED COOKIE
     * ===================================
     */
    it('return error when cookie expired', async () => {

        //------- simulate expired DB
        (prisma.twoFA.findUnique as any).mockResolvedValue({
            userId: 1,
            code: '999999',
            expiresAt: new Date(Date.now() - 10000)
        });

        const result = await submit2FACheckCode('999999');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le code a expiré."
        });

        expect(prisma.twoFA.delete).toHaveBeenCalledWith({ where: { userId: 1 } });
    });

});
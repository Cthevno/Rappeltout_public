import { chatTest } from './chat_validation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { prisma } from '$lib/server/prisma'

describe('ChatTest', () => {
    it('return error if message is to long or not', () => {
        expect(chatTest('a'.repeat(1000))).toBeNull();
        expect(chatTest('a'.repeat(1001))).toBe("Le message est trop long !");
        expect(chatTest('1'.repeat(5000))).toBe("Le message est trop long !");
    });
})

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        session: {
            findUnique: vi.fn()
        },
        user: {
            findUnique: vi.fn()
        },
        message: {
            findMany: vi.fn()
        }
    }
}));

describe('Chat Page Load Tests', () => {
    let fakeCookie: { get: any };

    beforeEach(() => {
        vi.clearAllMocks();
        fakeCookie = {
            get: vi.fn()
        };
    });

    /**
     * ===================================
     * SESSION COOKIE MISSING
     * ===================================
     */
    it('should redirect to welcome if session cookie is missing', async () => {
        fakeCookie.get.mockReturnValue(undefined);

        const event = { cookies: fakeCookie };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });
    });

    /**
     * ===================================
     * SESSION NOT FOUND OR EXPIRED
     * ===================================
     */
    it('should redirect to welcome if session does not exist or is expired', async () => {
        fakeCookie.get.mockReturnValue('expired_session');

        // expired session
        (prisma.session.findUnique as any).mockResolvedValue({
            id: 'expired_session',
            userId: 1,
            endedAt: new Date(Date.now() - 10000) 
        });

        const event = { cookies: fakeCookie };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });
    });

    /**
     * ===================================
     * USER HAS NO HOUSES
     * ===================================
     */
    it('should redirect to manage_house if user has joined no houses', async () => {
        fakeCookie.get.mockReturnValue('valid_session');

        (prisma.session.findUnique as any).mockResolvedValue({
            id: 'valid_session',
            userId: 1,
            endedAt: new Date(Date.now() + 100000)
        });

        //------ User exists but houseJoinded is empty
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 1,
            username: 'testuser',
            housesJoined: []
        });

        const event = { cookies: fakeCookie };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/manage_house'
        });
    });

    /**
     * ===================================
     * USER RECORD NOT FOUND IN DATABASE
     * ===================================
     */
    it('should redirect to welcome if session exists but user record is missing', async () => {
        fakeCookie.get.mockReturnValue('valid_session');

        //------ session ok
        (prisma.session.findUnique as any).mockResolvedValue({
            id: 'valid_session',
            userId: 999,
            endedAt: new Date(Date.now() + 100000)
        });

        //------ user dont exists
        (prisma.user.findUnique as any).mockResolvedValue(null);

        const event = { cookies: fakeCookie };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });
    });

    /**
     * ===================================
     * ALL GOOD
     * ===================================
     */
    it('should return chat data when session and house are valid', async () => {
        fakeCookie.get.mockReturnValue('valid_session');

        (prisma.session.findUnique as any).mockResolvedValue({
            id: 'valid_session',
            userId: 1,
            endedAt: new Date(Date.now() + 100000)
        });

        (prisma.user.findUnique as any).mockResolvedValue({
            id: 1,
            username: 'testuser',
            housesJoined: [{ code: 'HOUSE_ABC' }]
        });

        (prisma.message.findMany as any).mockResolvedValue([
            { id: 1, content: 'Hello world', houseCode: 'HOUSE_ABC', user: { username: 'testuser' } }
        ]);

        const event = { cookies: fakeCookie };

        const result = await load(event as any);

        expect(result).toEqual({
            username: 'testuser',
            userId: 1,
            houseCode: 'HOUSE_ABC',
            allMessages: expect.any(Array),
            seo: { title: "Chat - Rappeltout" }
        });
        expect(prisma.message.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { houseCode: 'HOUSE_ABC' } })
        );
    });
});
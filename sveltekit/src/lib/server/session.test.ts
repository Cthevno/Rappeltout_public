import { describe, it, expect, vi } from 'vitest'
import { prisma } from '$lib/server/prisma';
import { cleanExpiredSessions, createSessionAndCookie } from './session';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        session: {
            create: vi.fn(),
            deleteMany: vi.fn()
        }
    }
}));

describe('Test for session.ts', () => {
    const fakeCookie = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

    it('shoudl delete expired sessions form the database', async () => {
        await cleanExpiredSessions();

        expect(prisma.session.deleteMany).toHaveBeenCalledWith({
            where: {
                endedAt: { lt: expect.any(Date) }
            }
        });
    });

    it('shoudl delete expired sessions form the database and then create a new session in database and set a cookie session', async () => {

        const userId = 1;

        await createSessionAndCookie(userId, fakeCookie as any);

        expect(prisma.session.create).toHaveBeenCalledWith({
            data: {
                id: expect.any(String),
                userId: userId,
                endedAt:  expect.any(Date)
            }
        });

        expect(fakeCookie.set).toHaveBeenCalledWith(
            'session',
            expect.any(String),
            expect.objectContaining({
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true
            })
        );
    });
});

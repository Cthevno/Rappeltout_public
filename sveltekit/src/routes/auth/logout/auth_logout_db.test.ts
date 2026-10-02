import { actions as logoutActions } from './+page.server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '$lib/server/prisma';
import { load } from './+page.server';
import { blockAuth } from '$lib/server/blockAuth';



//------- simulation of Prisma
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        session: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 })
        }
    }
}));

vi.mock('$lib/server/blockAuth', () => ({
    blockAuth: vi.fn()
}));

describe('Logout Test Load', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * ===================================
     * USER NOT BLOCKED BECAUSE ALREADY CONNECTED
     * ===================================
     */
    it('return success if everything works', async () => {

        const event = {
            locals: { user: {id : 1} }
        };

        const result = await load(event as any); 

        expect(blockAuth).toHaveBeenCalledWith(event.locals);
        expect(result).toEqual({});
    });

});


describe('Logout Test Action', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('fake_session'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    /**
     * ===================================
     * ALL GOOD
     * ===================================
     */
    it('return success if everything works', async () => {

        await expect(
            logoutActions.default({
                cookies: fakeCookie as any,
                locals: { user: { id: 1 } }
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome'
        });

        expect(prisma.session.deleteMany).toHaveBeenCalledWith({
            where: { id: 'fake_session' }
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith('session', { path: '/' });

    });

});
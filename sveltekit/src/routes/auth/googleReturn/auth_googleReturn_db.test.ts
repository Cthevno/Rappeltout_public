import { load as googleReturnLoad } from './+page.server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '$lib/server/prisma'

//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn()
        },
        session: { create: vi.fn() }
    },
}));

vi.mock('$env/dynamic/private', () => ({
    env: {
        GOOGLE_CLIENT_ID: 'fake_client_id',
        GOOGLE_REDIRECT_URI: 'https://localhost:8443/auth/googleReturn',
        GOOGLE_SECRET_ID: 'fake_secret_id'
    }
}));


vi.mock('$lib/server/session', () => ({
    cleanExpiredSessions: vi.fn().mockResolvedValue(undefined),
    createSessionAndCookie: vi.fn().mockResolvedValue(undefined)
}));


describe('Google Return Level 2 Tests', () => {
    
    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        vi.clearAllMocks();
        //------- fake cookie

        fakeCookie = {
            get: vi.fn().mockReturnValue('state_123'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    const fakeUrl = new URL('https://localhost:8443/auth/googleReturn?code=my_fake_code&state=state_123');

    /**
     * ===================================
     * LOCALS USER DONT EXISTS
     * ===================================
     */
    it('return redirect when user already connected', async () => {

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: {user : { id: 1 } }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
        
        
    });

    /**
     * ===================================
     * ONE ELEMENT IS EMPTY (STATE EXEMPLE)
     * ===================================
     */
     it('return redirect if code, state or googleCookie are empty', async () => {

        const formData = new FormData;
        formData.append("googleCookie", "test");
        formData.append("code", "code");
        formData.append("state", "");

        const event = {
            url: new URL('https://localhost:8443/auth/googleReturn?code=123&state='),
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome?error=google_failed"
        });
    });

    /**
     * ===================================
     * STATE NOT MATCH
     * ===================================
     */
    it('return error when state not match', async () => {

        //------- cookie with state code (not same that URL)
        fakeCookie.get.mockReturnValue('state_456');

        //------- return URL google
        await expect(
            googleReturnLoad({
                url: fakeUrl,
                cookies: fakeCookie as any,
                locals: {}
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: '/auth/welcome?error=google_failed'
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith('google', { path: '/' });
    });

    /**
     * ===================================
     * TOKEN RESPONSE NOT OK (GOOGLE ERROR)
     * ===================================
     */
    it('return error when Google token endpoint returns not ok', async () => {

        //------- cookie with state code (not same that URL)
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate fetch who return an error (ok is false)
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome?error=google_failed"
        });

    });

    /**
     * ===================================
     * SECOND TOKEN RESPONSE NOT OK (GOOGLE INFO NOT OK)
     * ===================================
     */
    it('return error when Google token response returns not ok', async () => {

        //------- cookie with state code (not same that URL)
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate first fetch who return no error
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'fake_token'})
        })
            .mockResolvedValueOnce({
                ok: false, 
                status : 401
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome?error=google_failed"
        });
    });

    /**
     * ===================================
     * GOOGLE EMAIL IS NOT VERIFIED
     * ===================================
     */
    it('return redirect when google email is not verified', async () => {

        //------- cookie with state code (not same that URL)
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate first fetch who return no error
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'fake_token'})
        })
            .mockResolvedValueOnce({
               ok: true,
                json: async () => ({ email: 'test@hotmail.fr', email_verified: false})
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome?error=google_failed"
        });
    });

    /**
     * ===================================
     * NEW USER - USERNAME NO COLLISION
     * ===================================
     */
    it('should create new user with base username if it does not exist', async () => {
        //------- cookie with state code
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate fetch responses from Google API
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'fake_token' })
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ email: 'uniqueuser@hotmail.fr', email_verified: true })
            } as any);

        //------- user does not exist by email
        (prisma.user.findFirst as any).mockResolvedValue(null);

        //------- base username 'uniqueuser' is free (findUnique returns null)
        (prisma.user.findUnique as any).mockResolvedValue(null);

        //------- simulate user creation
        (prisma.user.create as any).mockResolvedValue({
            id: 1,
            username: 'uniqueuser',
            email: 'uniqueuser@hotmail.fr',
            password: null
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });

        //------- verify Prisma created user with the base username
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                username: 'uniqueuser',
                email: 'uniqueuser@hotmail.fr',
                password: null,
                accountValidated: true
            }
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith('google', { path: '/' });
    });

    /**
     * ===================================
     * NEW USER - USERNAME WITH COLLISION
     * ===================================
     */
    it('should append suffix to username if base username already exists', async () => {
        //------- cookie with state code
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate fetch responses from Google API
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'fake_token' })
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ email: 'collision@hotmail.fr', email_verified: true })
            } as any);

        //------- user does not exist by email
        (prisma.user.findFirst as any).mockResolvedValue(null);

        //------- first findUnique check: base username 'collision' is already taken
        (prisma.user.findUnique as any).mockResolvedValueOnce({
            id: 2,
            username: 'collision',
            email: 'other@hotmail.fr'
        });

        //------- second findUnique check: 'collision1' is free (returns null)
        (prisma.user.findUnique as any).mockResolvedValueOnce(null);

        //------- simulate user creation with suffix
        (prisma.user.create as any).mockResolvedValue({
            id: 3,
            username: 'collision1',
            email: 'collision@hotmail.fr',
            password: null
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });

        //------- verify Prisma created user with the incremented username suffix
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                username: 'collision1',
                email: 'collision@hotmail.fr',
                password: null,
                accountValidated: true
            }
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith('google', { path: '/' });
    });

    /**
     * ===================================
     * ALL GOOD
     * ===================================
     */
    it('success when all good', async () => {

        //------- cookie with state code (not same that URL)
        fakeCookie.get.mockReturnValue('state_123');

        //------- simulate first fetch who return no error
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'fake_token'})
        })
            .mockResolvedValueOnce({
               ok: true,
                json: async () => ({ email: 'test@hotmail.fr', email_verified: true})
        });

        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            username: 'test'
        });

        const event = {
            url: fakeUrl,
            cookies: fakeCookie,
            locals: { user: null }
        };

        await expect(googleReturnLoad(event as any)).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });

        expect(fakeCookie.delete).toHaveBeenCalledWith('google', { path: '/' });



    });

});
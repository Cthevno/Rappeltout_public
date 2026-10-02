import { actions as googleLoginActions } from './+page.server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { blockAuth } from '$lib/server/blockAuth';

//------- simulation of SvelteKit env
vi.mock('$env/dynamic/private', () => ({
    env: {
        GOOGLE_CLIENT_ID: 'fake_client_id_123',
        GOOGLE_REDIRECT_URI: 'https://localhost:8443/auth/googleReturn'
    }
}));

vi.mock('$lib/server/blockAuth', () => ({
    blockAuth: vi.fn()
}));

describe('Google Login Load Tests', () => {

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

describe('Google Login Action Tests', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        vi.clearAllMocks();
        //------- fake cookie
        fakeCookie = {
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    /**
     * ===================================
     * SUCCESSFUL GOOGLE REDIRECT
     * ===================================
     */
    it('should set google cookie and redirect to google auth url', async () => {
        let redirectError: any;

        try {
            await googleLoginActions.default({
                cookies: fakeCookie as any
            } as any);
        } catch (error) {
            redirectError = error;
        }

        //------- check that a redirect (303) was thrown
        expect(redirectError).toBeDefined();
        expect(redirectError.status).toBe(303);
        
        //------- check that the redirect goes to Google accounts URL
        expect(redirectError.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(redirectError.location).toContain('client_id=fake_client_id_123');
        expect(redirectError.location).toContain('response_type=code');
        expect(redirectError.location).toContain('scope=openid+email+profile');

        //------- check that the cookie 'google' was properly created with correct security options
        expect(fakeCookie.set).toHaveBeenCalledTimes(1);
        expect(fakeCookie.set).toHaveBeenCalledWith(
            'google',
            expect.any(String), // the state created by randomUUID()
            expect.objectContaining({
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: true,
                maxAge: 300
            })
        );
    });

    /**
     * ===================================
     * MISSING CLIENT ID REDIRECT ERROR
     * ===================================
     */
    it('should redirect to welcome error if client id or redirect uri is missing', async () => {
       
        vi.resetModules();
        
        vi.doMock('$env/dynamic/private', () => ({

            env: {
                GOOGLE_CLIENT_ID: '',
                GOOGLE_REDIRECT_URI: ''
            }
        }));

        const { actions } = await import('./+page.server');

        await expect(
            actions.default({} as any)
        ).rejects.toMatchObject({
            status: 303
        });
    });

});
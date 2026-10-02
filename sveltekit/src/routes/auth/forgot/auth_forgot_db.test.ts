import { actions as forgotActions } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { sendMail } from '$lib/server/email';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load } from './+page.server';
import { blockAuth } from '$lib/server/blockAuth';

//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn()
        },
        passwordReset: {
            findFirst: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockResolvedValue(true)
        },
    },
}));

vi.mock('$lib/server/session', () => ({
    cleanExpiredSessions: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/server/email', () => ({
    sendMail: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn()
    }
}));

vi.mock('$lib/server/blockAuth', () => ({
    blockAuth: vi.fn()
}));

describe('Forgot Test Load', () => {

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

describe('Create Level 2 Tests', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        vi.clearAllMocks();
        (prisma.passwordReset.findFirst as any).mockResolvedValue(null);

        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('1'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    const submitForgotEmailForm = async ( emailForm: string) => {
        //------- simulate form with bad code
        const formData = new FormData();
        formData.append('email', emailForm);

        //------- simulate HTTP request
        const request = new Request('http://localhost:8443/auth/create', {
            method: 'POST',
            body: formData
        });

        //------- executate actions
        const res: any = await forgotActions.default({
            request,
            cookies: fakeCookie as any
        } as any);

        return res?.data ?? res;

    }

    /**
     * ===================================
     * EMPTY VALUE
     * ===================================
     */
    it('return error when email is empty', async () => {

        const result = await submitForgotEmailForm('');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email manquant !"
        });

    });

    /**
     * ===================================
     * EMAIL FORMAT
     * ===================================
     */
    it('return error when email format is not good', async () => {

        const result = await submitForgotEmailForm('test@hotmail');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Format de l'email non valide !"
        });

    });

    /**
     * ===================================
     * EMAIL LONGER
     * ===================================
     */
    it('return error when email is longer', async () => {

        const result = await submitForgotEmailForm('testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@hotmail.fr');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email trop long !"
        });

    });

    /**
     * ===================================
     * GOOGLE
     * ===================================
     */
    it('return error when Google user', async () => {

        //------- simulate user searched
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            password : null
        });

        const result = await submitForgotEmailForm('test@hotmail.fr');

         //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Si cet email est associé à un compte, un lien a été envoyé."
        });

    });

    /**
     * ===================================
     * SPAM
     * ===================================
     */
    it('return success silently when email was already sent recently (anti-spam)', async () => {

        //------- simulate user searched
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            password : '12345678'
        });

        //------- simulate a previous token created 10 seconds ago 
        (prisma.passwordReset.findFirst as any).mockResolvedValue({
            id: 1,
            userId: 1,
            token: "test-token",
            createdAt: new Date(Date.now() - 10000),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        const result = await submitForgotEmailForm('test@hotmail.fr');

         //------- check actions send back error
        expect(result).toEqual({
            success: true,
            msg: "Si cet email est associé à un compte, un lien a été envoyé."
        });
        
        expect(sendMail).not.toHaveBeenCalled();
    });

    /**
     * ===================================
     * ALL GOOD
     * ===================================
     */
    it('return success when everything works', async () => {

        //------- simulate user searched
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            password: '12345678'
        });

        const result = await submitForgotEmailForm('test@hotmail.fr');

        //------- check actions send back null
        expect(result).toEqual({ success: true, msg: "Si cet email est associé à un compte, un lien a été envoyé." });
        
        expect(sendMail).toHaveBeenCalledWith(
            'test@hotmail.fr',
            "Lien pour changer votre mot de passe.",
            expect.stringContaining("Cliquer ici pour changer votre mot de passe : ")
        );

    });
    
     /**
         * ===================================
         * CRASH DB
         * ===================================
         */
        it('return error when DB crashed', async () => {
    
            //------- simulate username already exists in DB
            (prisma.user.findFirst as any).mockRejectedValue(new Error('DB crash'));
    
            const result = await submitForgotEmailForm('test@hotmail.fr');
    
            //------- check actions send back error
            expect(result).toEqual({
                success: false,
                error: "Erreur serveur."
            });
    
        });

});
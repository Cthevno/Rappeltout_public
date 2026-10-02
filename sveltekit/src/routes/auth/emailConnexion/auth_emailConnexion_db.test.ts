import { actions as emailConnexionActions } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { sendMail } from '$lib/server/email';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs';
import { load } from './+page.server';
import { blockAuth } from '$lib/server/blockAuth';

vi.mock('$lib/server/blockAuth', () => ({
    blockAuth: vi.fn()
}));


//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn()
        },
        twoFA: { upsert: vi.fn().mockResolvedValue(true) }
    },
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

describe('EmailConnexion Test Load', () => {

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

describe('Email Connexion Level 2 Tests', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('1'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    const submitAccountConnexionForm = async (emailForm: string, passwordForm: string) => {
        //------- simulate form with bad code
        const formData = new FormData();
        formData.append('email', emailForm);
        formData.append('password', passwordForm);

        //------- simulate HTTP request
        const request = new Request('http://localhost:8443/auth/create', {
            method: 'POST',
            body: formData
        });

        //------- executate actions
        const res: any = await emailConnexionActions.default({
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
    it.each([
        ['empty email', '', '12345678'],
        ['empty password', 'test@hotmail.fr', ''],
    ])
        ('return error when %s', async (_, email, password) => {
            const result = await submitAccountConnexionForm(email, password);

            //------- check actions send back error
            expect(result).toEqual({
                success: false,
                error: "Email ou mot de passe manquant"
            });
        });

    /**
     * ===================================
     * EMAIL LONGER
     * ===================================
     */
    it('return error when email is longer', async () => {

        const result = await submitAccountConnexionForm('testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@hotmail.fr', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email ou mot de passe trop long !"
        });

    });

    /**
     * ===================================
     * PASSWORD LONGER
     * ===================================
     */
    it('return error when password is longer', async () => {

        const result = await submitAccountConnexionForm('test@hotmail.fr', 'eknfozejfoezjfoijezoifjiozejfoizjefojzeofjozeijfozejfojzeofjozeifjozejfozfdlkfodngongonognzeognozengozengozengonzeoginozengozengkdngozngeoingozengknekgnokzengozegzengozengkengkzneongozeg');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email ou mot de passe trop long !"
        });

    });

    /**
     * ===================================
     * EMAIL FORMAT
     * ===================================
     */
    it('return error when email format is not good', async () => {

        const result = await submitAccountConnexionForm('test@hotmail', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Format de l'email non valide !"
        });

    });

    /**
    * ===================================
    * PASSWORD SHORTER
    * ===================================
    */
    it('return error when password is shorter', async () => {

        const result = await submitAccountConnexionForm('test@hotmail.fr', '123');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le mot de passe doit contenir plus de 7 caractères !"
        });

    });

    /**
     * ===================================
     * INCORRECT EMAIL
     * ===================================
     */

    it('return error when email is incorrect', async () => {

        //------- simulate user not found in DB
        (prisma.user.findFirst as any).mockResolvedValue(null);

        const result = await submitAccountConnexionForm('test2@hotmail.fr', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email ou mot de passe incorrect"
        });

    });

    /**
     * ===================================
     * INCORRECT PASSWORD
     * ===================================
     */

    it('return error when email not exists', async () => {

        //------- simulate email already exists in DB
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            password: '12345678'
        });

        //------- bcrypt.compare returns false for bad password
        (bcrypt.compare as any).mockResolvedValue(false);

        const result = await submitAccountConnexionForm('test@hotmail.fr', '02345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email ou mot de passe incorrect"
        });
    });

    /**
     * ===================================
     * GOOGLE USER
     * ===================================
     */

    it('return error when account is Google', async () => {

        //------- simulate email already exists in DB
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            email: 'test@hotmail.fr',
            password: null
        });

        const result = await submitAccountConnexionForm('test@hotmail.fr', '02345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email ou mot de passe incorrect"
        });
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
            password: '12345678',
        });

        //------- bcrypt.compare returns true for correct password
        (bcrypt.compare as any).mockResolvedValue(true);

        const result = await submitAccountConnexionForm('test@hotmail.fr', '12345678');

        //------- check actions send back null
        expect(result).toEqual({ success: true, requires2FA: true });

        //------- check cookie 2FA is created
        expect(fakeCookie.set).toHaveBeenCalledWith(
            'twoFA',
            expect.any(String),
            expect.objectContaining({
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true
            })
        );

        expect(sendMail).toHaveBeenCalledWith(
            'test@hotmail.fr',
            "Votre code de sécurité",
            expect.stringContaining("Votre code est : ")
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

        const result = await submitAccountConnexionForm('test@hotmail.fr', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Erreur serveur."
        });

    });

});
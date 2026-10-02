import { actions as createActions } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { sendMail } from '$lib/server/email';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load } from './+page.server';


//------- simulation of Prisma to not touch real DB
vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            create: vi.fn().mockResolvedValue(true),
            findFirst: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            deleteMany: vi.fn().mockResolvedValue(true),
            update: vi.fn().mockResolvedValue(true)
        },
        twoFA: {
            upsert: vi.fn().mockResolvedValue(true)
        }
    },
}));

vi.mock('$lib/server/email', () => ({
    sendMail: vi.fn().mockResolvedValue(undefined)
}));

describe('Create Test Load', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * ===================================
     * USER NOT BLOCKED BECAUSE ALREADY CONNECTED
     * ===================================
     */
    it('return redirect to home if user is already connected', async () => {
        const event = {
            locals: { user: { id: 1 } }
        };

        await expect(load(event as any)).rejects.toMatchObject({
            status: 303,
            location: '/home'
        });
    });

});


describe('Create Level 2 Tests', () => {

    let fakeCookie: { get: any; set: any; delete: any; };

    beforeEach(() => {
        //------- fake cookie
        fakeCookie = {
            get: vi.fn().mockReturnValue('1'),
            set: vi.fn(),
            delete: vi.fn()
        };
    });

    const submitAccountCreateForm = async (usernameForm: string, emailForm: string, passwordForm: string, password_confirmForm: string) => {
        //------- simulate form with bad code
        const formData = new FormData();
        formData.append('username', usernameForm);
        formData.append('email', emailForm);
        formData.append('password', passwordForm);
        formData.append('password_confirm', password_confirmForm);

        //------- simulate HTTP request
        const request = new Request('http://localhost:8443/auth/create', {
            method: 'POST',
            body: formData
        });

        //------- executate actions
        const res: any = await createActions.default({
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
        ['empty username', '', 'test@hotmail.fr', '12345678', '12345678'],
        ['empty email', 'mlaussel', '', '12345678', '12345678'],
        ['empty password', 'mlaussel', 'test@hotmail.fr', '', '12345678'],
        ['empty password confirm', 'mlaussel', 'test@hotmail.fr', '12345678', '']
    ])
        ('return error when %s', async (_, username, email, password, password_confirm) => {
            const result = await submitAccountCreateForm(username, email, password, password_confirm);

            //------- check actions send back error
            expect(result).toEqual({
                success: false,
                error: "Au moins un element est vide !"
            });
        });

    /**
     * ===================================
     * DIFFERENT PASSWORD
     * ===================================
     */
    it('return error when password is not the same that password confirm', async () => {

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '12345678', '123456789');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Les mots de passe ne correspondent pas !"
        });

    });

    /**
     * ===================================
     * EMAIL FORMAT
     * ===================================
     */
    it('return error when email format is not good', async () => {

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail', '12345678', '12345678');

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

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '123', '123');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Le mot de passe doit contenir plus de 7 caractères !"
        });

    });

    /**
     * ===================================
     * PASSWORD LONGER
     * ===================================
     */
    it('return error when password is longer', async () => {

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', 'eknfozejfoezjfoijezoifjiozejfoizjefojzeofjozeijfozejfojzeofjozeifjozejfozfdlkfodngongonognzeognozengozengozengonzeoginozengozengkdngozngeoingozengknekgnokzengozegzengozengkengkzneongozeg', 'eknfozejfoezjfoijezoifjiozejfoizjefojzeofjozeijfozejfojzeofjozeifjozejfozfdlkfodngongonognzeognozengozengozengonzeoginozengozengkdngozngeoingozengknekgnokzengozegzengozengkengkzneongozeg');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Mot de passe trop long !"
        });

    });

    /**
     * ===================================
     * USERNALE SHORTER
     * ===================================
     */
    it('return error when username is shorter', async () => {

        const result = await submitAccountCreateForm('a', 'test@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Pseudo trop court !"
        });

    });

    /**
     * ===================================
     * USERNAME LONGER
     * ===================================
     */
    it('return error when username is longer', async () => {

        const result = await submitAccountCreateForm('HELLOWORLD42LYONTESTTESTTEST', 'test@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Pseudo trop long !"
        });

    });

    /**
     * ===================================
     * EMAIL LONGER
     * ===================================
     */
    it('return error when email is longer', async () => {

        const result = await submitAccountCreateForm('mlaussel', 'testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Email trop long !"
        });

    });

    /**
     * ===================================
     * EMAIL ALREADY USED
     * ===================================
     */
    it('return error when email is already used', async () => {

        //------- simulate email already exists in DB
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            username: 'test',
            email: 'test@hotmail.fr',
        });

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Cet email existe déjà !"
        });

    });

    /**
     * ===================================
     * USERNAME ALREADY USED
     * ===================================
     */
    it('return error when username is already used', async () => {

        //------- simulate email already exists in DB
        (prisma.user.findFirst as any).mockResolvedValue({
            id: 1,
            username: 'mlaussel',
            email: 'test2@hotmail.fr',
        });

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Ce pseudo est déjà pris !"
        });

    });

    /**
     * ===================================
     * CRASH DB
     * ===================================
     */
    it('return error when DB crashed', async () => {

        //------- simulate username already exists in DB
        (prisma.user.findFirst as any).mockRejectedValue(new Error('DB crash'));

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '12345678', '12345678');

        //------- check actions send back error
        expect(result).toEqual({
            success: false,
            error: "Erreur serveur."
        });

    });

    /**
     * ===================================
     * ALL GOOD
     * ===================================
     */
    it('return success when everything works', async () => {

        //------- simulate findMany returning expired user to delete
        (prisma.user.findMany as any).mockResolvedValue([{ id: 99 }]);

        //------- simulate user is in DB so send back null (no error)
        (prisma.user.findFirst as any).mockResolvedValue(null);

        //------- simulate user created
        (prisma.user.create as any).mockResolvedValue({
            id: 1,
            username: 'mlaussel',
            email: 'test@hotmail.fr',
            password: '12345678',
            password_confirm: '12345678'
        });

        const result = await submitAccountCreateForm('mlaussel', 'test@hotmail.fr', '12345678', '12345678');

        //------- check deletions and calls happened
        expect(prisma.user.findMany).toHaveBeenCalled();
        expect(prisma.user.deleteMany).toHaveBeenCalledWith({
            where: { id: { in: [99] } }
        });

        //------- check cookie session is created
        expect(fakeCookie.set).toHaveBeenCalledWith(
            'twoFA',
            expect.any(String),
            expect.objectContaining({
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
                maxAge: 300
            })
        );

        expect(prisma.twoFA.upsert).toHaveBeenCalled();

        expect(sendMail).toHaveBeenCalledWith(
            'test@hotmail.fr',
            "Bienvenue sur Rappeltout : Votre code de sécurité",
            expect.stringContaining("Votre code est : ")
        );

        expect(result).toEqual({ success: true, requires2FA: true });

    });


});
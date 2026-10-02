import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma'
import { generateCode } from '$lib/generateCode.js'
import { sendMail } from '$lib/server/email.js'
import { sendInvitationMail } from '$lib/server/sendInvitationMail'
import { Prisma, Role } from '@prisma/client'
import { create_notification } from "$lib/server/notification";

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        house: {
            findFirst: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        invitation: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
        sharedTask: {
            findMany: vi.fn(),
            update: vi.fn().mockReturnValue({}),
        },
        taskCompletion: {
            deleteMany: vi.fn().mockReturnValue({}),
        },
        $transaction: vi.fn(),
    }
}));

vi.mock('$lib/generateCode.js', () => ({
    generateCode: vi.fn(),
}));

vi.mock('$lib/server/email.js', () => ({
    sendMail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/server/sendInvitationMail', () => ({
    sendInvitationMail: vi.fn().mockResolvedValue(undefined),
    isEmailDomainValid: vi.fn().mockResolvedValue(true),
    notifyFailure: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/server/notification', () => ({
    create_notification: vi.fn()
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("manage_house - accept", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.accept({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("does nothing if the user doesn't have a household", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);
        const result = await actions.accept({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.update).not.toHaveBeenCalled();
    });
    it("accepts the pending member", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            pendingMembers: [
                { id: 2, username: "Hermione" }
            ],
            members: [
                { id: 1 },
                { id: 3 }
            ]
        });
        const result = await actions.accept({ request, locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { members: { some: { id: 1 } } },
            include: {
                pendingMembers: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                members: {
                    select: {
                        id: true
                    }
                }
            }
        });
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: {
                pendingMembers: { disconnect: { id: 2 } },
                members: { connect: { id: 2 } }
            }
        });
        // Notifies the accepted user that their request to join the household was approved.
        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Demande acceptée',
            'Ta demande pour rejoindre le foyer "Poudlard" a été acceptée.',
            '/home'
        );
        // Notifies existing household members that a new member joined.
        expect(create_notification).toHaveBeenCalledWith(
            1,
            'INVITATION',
            'Nouveau membre dans le foyer',
            'Hermione a rejoint le foyer "Poudlard".',
            '/house'
        );

        expect(create_notification).toHaveBeenCalledWith(
            3,
            'INVITATION',
            'Nouveau membre dans le foyer',
            'Hermione a rejoint le foyer "Poudlard".',
            '/house'
        );

        expect(create_notification).toHaveBeenCalledTimes(3);

        expect(result).toBeUndefined();
    });

    it("refuses a student", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        const result = await actions.accept({ request, locals } as any);
        expect(result).toMatchObject({
            status: 403,
            data: { error: "Action non autorisée" }
        });
        expect(prisma.house.update).not.toHaveBeenCalled();
    });
});

describe("manage_house - reject", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.reject({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("does nothing if the user doesn't have a household", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.reject({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.update).not.toHaveBeenCalled();
    });
    it("rejects the pending member", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard"
        });

        const result = await actions.reject({ request, locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { members: { some: { id: 1 } } }
        });
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: {
                pendingMembers: { disconnect: { id: 2 } },
            }
        });
        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Demande refusée',
            'Ta demande pour rejoindre le foyer "Poudlard" a été refusée.',
            '/home'
        );
        expect(result).toBeUndefined();
    });

    it("refuses a student", async () => {
        const formData = new FormData();
        formData.append("pendingId", "2");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        const result = await actions.reject({ request, locals } as any);
        expect(result).toMatchObject({
            status: 403,
            data: { error: "Action non autorisée" }
        });
        expect(prisma.house.update).not.toHaveBeenCalled();
    });
});

describe("manage_house - renameHouse", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.renameHouse({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("rejects if the houseName field is not even sent", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.renameHouse({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Le nom du foyer ne peut pas être vide" }
        });
    });
    it("rejects if the household name is empty", async () => {
        const formData = new FormData();
        formData.append("houseName", "");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.renameHouse({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Le nom du foyer ne peut pas être vide" }
        });
    });
    it("responds 404 if the household is not found", async () => {
        const formData = new FormData();
        formData.append("houseName", "Poudlard");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.renameHouse({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { error: "Foyer introuvable" }
        });
    });

    it("refuses house rename when user lacks permission", async () => {
        const formData = new FormData();
        formData.append("houseName", "Poudlard");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        const result = await actions.renameHouse({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.update).not.toHaveBeenCalled();
    });
    it("refuses a household name longer than 60 characters", async () => {
        const formData = new FormData();
        formData.append("houseName", "A".repeat(61));
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.renameHouse({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: {
                error: "Le nom du foyer ne peut pas dépasser 60 caractères"
            }
        });
        expect(prisma.house.update).not.toHaveBeenCalled();
    });

    it("renames the household when everything is valid", async () => {
        const formData = new FormData();
        formData.append("houseName", "Poudlard");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]
        });

        const result = await actions.renameHouse({ request, locals } as any);
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: { houseName: "Poudlard" }
        });
        expect(create_notification).toHaveBeenCalledTimes(3);

        expect(create_notification).toHaveBeenNthCalledWith(
            1,
            1,
            'INVITATION',
            'Foyer renommé',
            'Le foyer s\'appelle maintenant "Poudlard".',
            '/house'
        );

        expect(create_notification).toHaveBeenNthCalledWith(
            2,
            2,
            'INVITATION',
            'Foyer renommé',
            'Le foyer s\'appelle maintenant "Poudlard".',
            '/house'
        );

        expect(create_notification).toHaveBeenNthCalledWith(
            3,
            3,
            'INVITATION',
            'Foyer renommé',
            'Le foyer s\'appelle maintenant "Poudlard".',
            '/house'
        );
        expect(result).toBeUndefined();
    });
});

describe("manage_house - regenerateCode", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.regenerateCode({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("does nothing if the user doesn't have a household", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.regenerateCode({ locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.update).not.toHaveBeenCalled();
    });
    it("regenerates the household's code", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({ code: "LUMOS-42" });
        (generateCode as any).mockReturnValue("NOX-7");
        (prisma.house.update as any).mockResolvedValue({ code: "NOX-7" });

        const result = await actions.regenerateCode({ locals } as any);
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: { code: "NOX-7" }
        });
        expect(result).toBeUndefined();
    });
    it("regenerates a new code on collision (P2002)", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({ code: "LUMOS-42" });
        (generateCode as any)
            .mockReturnValueOnce("NOX-7")
            .mockReturnValueOnce("AQUA-3");

        const collisionError = new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            { code: "P2002", clientVersion: "6.19.3" }
        );
        (prisma.house.update as any)
            .mockRejectedValueOnce(collisionError)
            .mockResolvedValueOnce({ code: "AQUA-3" });

        const result = await actions.regenerateCode({ locals } as any);
        expect(prisma.house.update).toHaveBeenCalledTimes(2);
        expect(prisma.house.update).toHaveBeenLastCalledWith({
            where: { code: "LUMOS-42" },
            data: { code: "AQUA-3" }
        });
        expect(result).toBeUndefined();
    });
    it("rethrows the error if it's not a code collision (P2002)", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({ code: "LUMOS-42" });
        (generateCode as any).mockReturnValue("NOX-7");

        const dbError = new Error("Connexion à la base perdue");
        (prisma.house.update as any).mockRejectedValue(dbError);

        await expect(
            actions.regenerateCode({ locals } as any)
        ).rejects.toBe(dbError);
        expect(prisma.house.update).toHaveBeenCalledTimes(1);
    });
    it("refuses code regeneration when user lacks permission", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        const result = await actions.regenerateCode({ locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.update).not.toHaveBeenCalled();
    });
});

describe("manage_house - createInvitation", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.createInvitation({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("rejects if the email field is not even sent", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.createInvitation({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Email requis" }
        });
    });
    it("rejects if the email is empty", async () => {
        const formData = new FormData();
        formData.append("email", "   ");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.createInvitation({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Email requis" }
        });
    });
    it("responds 404 if the household is not found", async () => {
        const formData = new FormData();
        formData.append("email", "hermione@hogwarts.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.createInvitation({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { error: "Foyer introuvable" }
        });
    });
    it("rejects if the person is already a member of the household", async () => {
        const formData = new FormData();
        formData.append("email", "Hermione@Hogwarts.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce({ code: "LUMOS-42" })
            .mockResolvedValueOnce({ id: 3 });

        const result = await actions.createInvitation({ request, locals } as any);
        expect(prisma.house.findFirst).toHaveBeenLastCalledWith({
            where: { code: "LUMOS-42", members: { some: { email: { equals: "hermione@hogwarts.com", mode: 'insensitive' } } } }
        });
        expect(result).toEqual({
            status: 400,
            data: { error: "Cette personne est déjà membre du foyer" }
        });
    });
    it("rejects if an invitation is already pending for this email", async () => {
        const formData = new FormData();
        formData.append("email", "hermione@hogwarts.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce({ code: "LUMOS-42" })
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue({ id: 9 });

        const result = await actions.createInvitation({ request, locals } as any);
        expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
            where: { email_houseCode: { email: "hermione@hogwarts.com", houseCode: "LUMOS-42" } }
        });
        expect(result).toEqual({
            status: 400,
            data: { error: "Une invitation est déjà en attente pour cet email" }
        });
    });
    it("creates the invitation and sends the email when everything is valid", async () => {
        const formData = new FormData();
        formData.append("email", "hermione@gmail.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce({ code: "LUMOS-42" })
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue(null);
        (prisma.invitation.create as any).mockResolvedValue({ id: 1 });

        const result = await actions.createInvitation({ request, locals } as any);
        expect(prisma.invitation.create).toHaveBeenCalledWith({
            data: { email: "hermione@gmail.com", houseCode: "LUMOS-42" }
        });
        expect(sendInvitationMail).toHaveBeenCalledWith(
            "hermione@gmail.com",
            expect.stringContaining("LUMOS-42"),
            1,
        );
        expect(result).toBeUndefined();
    });
    it("rejects if an invitation was created in the meantime (P2002)", async () => {
        const formData = new FormData();
        formData.append("email", "hermione@hogwarts.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce({ code: "LUMOS-42" })
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue(null);

        const collisionError = new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            { code: "P2002", clientVersion: "6.19.3" }
        );
        (prisma.invitation.create as any).mockRejectedValue(collisionError);

        const result = await actions.createInvitation({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Une invitation est déjà en attente pour cet email" }
        });
        expect(sendMail).not.toHaveBeenCalled();
    });
    it("rethrows the error if creation fails for a reason other than P2002", async () => {
        const formData = new FormData();
        formData.append("email", "hermione@hogwarts.com");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce({ code: "LUMOS-42" })
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue(null);

        const dbError = new Error("Connexion à la base perdue");
        (prisma.invitation.create as any).mockRejectedValue(dbError);

        await expect(
            actions.createInvitation({ request, locals } as any)
        ).rejects.toBe(dbError);
        expect(sendMail).not.toHaveBeenCalled();
    });
    it("refuses invitation creation when user lacks permission", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        const result = await actions.createInvitation({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });
    });
});

describe("manage_house - sendInvitation", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.sendInvitation({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("does nothing if the invitationId field is not even sent", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.sendInvitation({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
    });
    it("does nothing if invitationId is not a valid number", async () => {
        const formData = new FormData();
        formData.append("invitationId", "abc");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.sendInvitation({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
    });
    it("does nothing if the user doesn't have a household", async () => {
        const formData = new FormData();
        formData.append("invitationId", "5");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.sendInvitation({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.invitation.findFirst).not.toHaveBeenCalled();
    });
    it("does nothing if the invitation is not found", async () => {
        const formData = new FormData();
        formData.append("invitationId", "5");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({ code: "LUMOS-42" });
        (prisma.invitation.findFirst as any).mockResolvedValue(null);

        const result = await actions.sendInvitation({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(sendMail).not.toHaveBeenCalled();
    });
    it("resends the invitation email", async () => {
        const formData = new FormData();
        formData.append("invitationId", "5");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({ code: "LUMOS-42" });
        (prisma.invitation.findFirst as any).mockResolvedValue({ id: 5, email: "hermione@gmail.com", houseCode: "LUMOS-42" });

        const result = await actions.sendInvitation({ request, locals } as any);
        expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
            where: { id: 5, houseCode: "LUMOS-42" }
        });
        expect(sendInvitationMail).toHaveBeenCalledWith(
            "hermione@gmail.com",
            expect.stringContaining("LUMOS-42"),
            1,
        );
        expect(result).toBeUndefined();
    });
    it("refuses invitation sending when user lacks permission", async () => {
        const formData = new FormData();
        formData.append("invitationId", "1");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        const result = await actions.sendInvitation({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });
    });
});

describe("manage_house - deleteInvitation", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.deleteInvitation({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("successfully deletes the invitation if it belongs to the user's house", async () => {
        const formData = new FormData();
        formData.append("invitationId", "10");
        const request = new Request("http://localhost/manage_house", {
            method: 'POST',
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard"
        });

        (prisma.invitation.findFirst as any).mockResolvedValue({
            id: 10,
            email: "test@hogwarts.com",
            houseCode: "LUMOS-42"
        });

        (prisma.invitation.delete as any).mockResolvedValue({});

        const result = await actions.deleteInvitation({ request, locals } as any);

        expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
            where: { id: 10, houseCode: "LUMOS-42" }
        });
        expect(prisma.invitation.delete).toHaveBeenCalledWith({
            where: { id: 10 }
        });
        expect(result).toEqual({ success: true });
    });
});

describe("manage_house - deleteHouse", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.deleteHouse({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("refuses a user who cannot edit the household", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        const result = await actions.deleteHouse({ locals } as any);
        expect(result).toMatchObject({
            status: 403,
            data: { error: "Action non autorisée" }
        });
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });

    it("responds 404 if the user is not the household's creator", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);
        const result = await actions.deleteHouse({ locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { creatorId: 1 },
            include: { members: { select: { id: true } } }
        });
        expect(result).toEqual({
            status: 404,
            data: { error: "Vous n'êtes pas autorisé à supprimer le foyer" }
        });
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });
    it("deletes the household when the user is its creator", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        await expect(
            actions.deleteHouse({ locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
        expect(prisma.house.delete).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" }
        });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { role: Role.STUDENT }
        });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.STUDENT }
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect((prisma.$transaction as any).mock.calls[0][0]).toHaveLength(3);
        // Notifies every member that the household has been deleted.
        expect(create_notification).toHaveBeenCalledTimes(2);

        expect(create_notification).toHaveBeenCalledWith(
            1,
            'INVITATION',
            'Foyer supprimé',
            'Le foyer "Poudlard" a été supprimé. Tu peux en créer un autre ou en rejoindre un nouveau.',
            null
        );

        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Foyer supprimé',
            'Le foyer "Poudlard" a été supprimé. Tu peux en créer un autre ou en rejoindre un nouveau.',
            null
        );
    });
});

describe("manage_house - changeRole", () => {
    it("allows HEADMASTER to change a member role", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        formData.append("role", Role.TEACHER);

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Poudlard",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });

        await actions.changeRole({ request, locals } as any);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.TEACHER }
        });
        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Rôle modifié',
            'Ton rôle dans le foyer "Poudlard" est maintenant Professeur.',
            '/house'
        );
    });

    it("allows TEACHER to change a member role", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        formData.append("role", Role.TEACHER);
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        await actions.changeRole({ request, locals } as any);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.TEACHER }
        });
    });
    it("refuses TEACHER changing the HEADMASTER role", async () => {
        const formData = new FormData();
        formData.append("memberId", "1");
        formData.append("role", Role.STUDENT);

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 2,
                role: Role.TEACHER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Poudlard",
            members: [
                { id: 1, role: Role.HEADMASTER },
                { id: 2, role: Role.TEACHER }
            ]
        });

        const result = await actions.changeRole({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Le rôle du directeur ne peut pas être modifié" }
        });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });
    it("refuses changing own role", async () => {
        const formData = new FormData();
        formData.append("memberId", "1");
        formData.append("role", Role.STUDENT);

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };

        const result = await actions.changeRole({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Vous ne pouvez pas modifier votre propre rôle" }
        });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses assigning HEADMASTER through role change", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        formData.append("role", Role.HEADMASTER);

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };

        const result = await actions.changeRole({ request, locals } as any);

        expect(result).toEqual({
            status: 400,
            data: { error: "Rôle invalide" }
        });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses changing role of a member outside the house", async () => {
        const formData = new FormData();
        formData.append("memberId", "99");
        formData.append("role", Role.TEACHER);

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });

        const result = await actions.changeRole({ request, locals } as any);

        expect(result).toEqual({
            status: 404,
            data: { error: "Membre introuvable" }
        });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });
});

describe("manage_house - transferHeadmaster", () => {
    it("transfers HEADMASTER role to another house member", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Poudlard",
            creatorId: 1,
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        (prisma.user.update as any).mockReturnValue({});
        (prisma.house.update as any).mockReturnValue({});
        (prisma.$transaction as any).mockResolvedValue([]);
        const result = await actions.transferHeadmaster({
            request,
            locals
        } as any);
        expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
            where: { id: 1 },
            data: { role: Role.TEACHER }
        });
        expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
            where: { id: 2 },
            data: { role: Role.HEADMASTER }
        });
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "TEST-123" },
            data: { creatorId: 2 }
        });
        expect(prisma.$transaction).toHaveBeenCalledWith([
            expect.anything(),
            expect.anything(),
            expect.anything()
        ]);
        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Nouveau rôle : Directeur',
            'Tu es maintenant Directeur du foyer "Poudlard".',
            '/house'
        );
        expect(result).toBeUndefined();
    });

    it("refuses HEADMASTER transfer by TEACHER", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };
        const result = await actions.transferHeadmaster({
            request,
            locals
        } as any);
        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses transferring HEADMASTER role to self", async () => {
        const formData = new FormData();
        formData.append("memberId", "1");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.transferHeadmaster({
            request,
            locals
        } as any);
        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses transferring HEADMASTER role to a member outside the house", async () => {
        const formData = new FormData();
        formData.append("memberId", "99");
        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            creatorId: 1,
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        const result = await actions.transferHeadmaster({
            request,
            locals
        } as any);
        expect(result).toEqual({
            status: 404,
            data: { error: "Membre introuvable" }
        });
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});

describe("manage_house - deleteMember", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.deleteMember({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it.each(["0", "abc"])("does nothing if memberId is invalid: %s", async (id) => {
        const formData = new FormData();
        formData.append("memberId", id);
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.deleteMember({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
    });
    it("does nothing if the user doesn't have a household", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.deleteMember({ request, locals } as any);
        expect(result).toBeUndefined();
        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });
    it("deletes the household if the targeted member is the creator and the last remaining member", async () => {
        const formData = new FormData();
        formData.append("memberId", "1");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            creatorId: 1,
            members: [{ id: 1 }]
        });

        const result = await actions.deleteMember({ request, locals } as any);
        expect(prisma.house.delete).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" }
        });
        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
    it("simply removes the targeted member if other members remain", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");
        const request = new Request("http://localhost/manage_house",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            creatorId: 1,
            members: [{ id: 1 }, { id: 2 }]
        });
        // The removed member is still assigned to a shared task.
        (prisma.sharedTask.findMany as any).mockResolvedValue([
            { id: 10 }
        ]);
        (prisma.house.update as any).mockResolvedValue(undefined);
        (prisma.user.update as any).mockReturnValue({});
        (prisma.$transaction as any).mockResolvedValue([]);
        const result = await actions.deleteMember({ request, locals } as any);
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: {
                members: { disconnect: { id: 2 } },
            }
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.STUDENT }
        });
        // Removes the member from every shared task they were assigned to.
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                assignees: {
                    disconnect: { id: 2 }
                }
            }
        });
        expect(prisma.$transaction).toHaveBeenCalledWith([
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything()
        ]);
        // Notifies the removed member that they no longer belong to the household.
        expect(create_notification).toHaveBeenCalledWith(
            2,
            'INVITATION',
            'Retrait du foyer',
            'Tu as été retiré du foyer "Poudlard".',
            null
        );
        expect(prisma.house.delete).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
    it("refuses member removal when user lacks permission", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        const result = await actions.deleteMember({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });
    it("allows TEACHER to remove a STUDENT", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts",
            creatorId: 3,
            members: [
                { id: 1, role: Role.TEACHER },
                { id: 2, role: Role.STUDENT },
                { id: 3, role: Role.HEADMASTER }
            ]
        });

        await actions.deleteMember({ request, locals } as any);

        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "TEST-123" },
            data: {
                members: { disconnect: { id: 2 } }
            }
        });
    });
    it("refuses TEACHER removing another TEACHER", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.TEACHER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts",
            creatorId: 3,
            members: [
                { id: 1, role: Role.TEACHER },
                { id: 2, role: Role.TEACHER },
                { id: 3, role: Role.HEADMASTER }
            ]
        });

        const result = await actions.deleteMember({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });
    it("refuses removing the HEADMASTER", async () => {
        const formData = new FormData();
        formData.append("memberId", "2");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts",
            creatorId: 2,
            members: [
                { id: 1, role: Role.HEADMASTER },
                { id: 2, role: Role.HEADMASTER }
            ]
        });

        const result = await actions.deleteMember({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.house.delete).not.toHaveBeenCalled();
    });
});

describe("manage_house - leaveHouse", () => {
    it("allows TEACHER to leave the house and resets role to STUDENT", async () => {
        const locals = {
            user: {
                id: 2,
                username: "Hermione",
                role: Role.TEACHER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        // The leaving member is still assigned to a shared task.
        (prisma.sharedTask.findMany as any).mockResolvedValue([
            { id: 10 }
        ]);
        (prisma.house.update as any).mockReturnValue({});
        (prisma.user.update as any).mockReturnValue({});
        (prisma.$transaction as any).mockResolvedValue([]);
        await expect(
            actions.leaveHouse({ locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "TEST-123" },
            data: {
                members: {
                    disconnect: { id: 2 }
                }
            }
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.STUDENT }
        });
        // Removes the leaving member from every shared task they were assigned to.
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                assignees: {
                    disconnect: { id: 2 }
                }
            }
        });
        expect(prisma.$transaction).toHaveBeenCalledWith([
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything()
        ]);
        // Notifies the remaining household members when a member leaves.
        expect(create_notification).toHaveBeenCalledTimes(1);

        expect(create_notification).toHaveBeenCalledWith(
            1,
            'INVITATION',
            'Un membre a quitté le foyer',
            'Hermione a quitté le foyer.',
            '/house'
        );

    });

    it("refuses HEADMASTER leaving when other members remain", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            members: [
                { id: 1 },
                { id: 2 }
            ]
        });
        const result = await actions.leaveHouse({ locals } as any);
        expect(result).toEqual({
            status: 403,
            data: {
                error: "Vous devez transférer la direction avant de quitter le foyer"
            }
        });
        expect(prisma.house.delete).not.toHaveBeenCalled();
        expect(prisma.house.update).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("allows sole HEADMASTER to leave and deletes the house", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            members: [
                { id: 1 }
            ]
        });
        (prisma.house.delete as any).mockReturnValue({});
        (prisma.user.update as any).mockReturnValue({});
        (prisma.$transaction as any).mockResolvedValue([]);
        await expect(
            actions.leaveHouse({ locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
        expect(prisma.house.delete).toHaveBeenCalledWith({
            where: { code: "TEST-123" }
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { role: Role.STUDENT }
        });
        expect(prisma.$transaction).toHaveBeenCalledWith([
            expect.anything(),
            expect.anything()
        ]);
    });
});

describe("manage_house - load", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            load({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("returns the household's data correctly", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const fakeHouse = {
            code: "LUMOS-42",
            houseName: "Poudlard",
            pendingMembers: [{ id: 3, username: "Ron" }],
            members: [{ id: 1, username: "Harry", role: Role.HEADMASTER }],
            invitations: [{ id: 9, email: "hermione@hogwarts.com" }]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const result = await load({ locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: {
                members: { some: { id: 1 } }
            },
            include: {
                pendingMembers: { select: { id: true, username: true } },
                members: { select: { id: true, username: true, role: true } },
                invitations: { select: { id: true, email: true } }
            }
        });
        expect(result).toEqual({
            current_user: {
                id: 1,
                role: Role.HEADMASTER
            },
            pendingMembers: fakeHouse.pendingMembers,
            houseName: "Poudlard",
            code: "LUMOS-42",
            members: fakeHouse.members,
            pendingInvitations: fakeHouse.invitations,
            seo: { title: "Paramètres Foyer - Rappeltout" }
        });
    });
    it("returns default values if the user doesn't have a household", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);
        const result = await load({ locals } as any);
        expect(result).toEqual({
            current_user: {
                id: 1,
                role: Role.HEADMASTER
            },
            pendingMembers: [],
            houseName: undefined,
            code: "",
            members: [],
            pendingInvitations: [],
            seo: { title: "Paramètres Foyer - Rappeltout" }
        });
    });
});

describe("manage_house roles", () => {
    it("assigns STUDENT role to an accepted member", async () => {
        const formData = new FormData();
        formData.set("pendingId", "2");

        const request = new Request("http://localhost/manage_house", {
            method: "POST",
            body: formData
        });

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts",
            pendingMembers: [
                { id: 2, username: "Hermione" }
            ],
            members: [
                { id: 1 }
            ]
        });

        (prisma.house.update as any).mockReturnValue({});
        (prisma.user.update as any).mockReturnValue({});
        (prisma.$transaction as any).mockResolvedValue([]);

        await actions.accept({
            request,
            locals: {
                user: {
                    id: 1,
                    username: "Harry",
                    role: Role.HEADMASTER
                }
            }
        } as any);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { role: Role.STUDENT }
        });
    });
});

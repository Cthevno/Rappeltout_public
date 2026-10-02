import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions } from './+page.server';
import { prisma } from '$lib/server/prisma'
import { generateCode } from '$lib/generateCode.js'
import { Prisma, Role } from '@prisma/client'
import { userHasHouse } from '$lib/server/house';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        $transaction: vi.fn(async (operations) => Promise.all(operations)),
        house: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
        invitation: {
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        }
    }
}));

vi.mock('$lib/generateCode.js', () => ({
    generateCode: vi.fn(),
}));

vi.mock('$lib/server/house', () => ({
    userHasHouse: vi.fn(),
    userHouseWhere: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (userHasHouse as any).mockResolvedValue(false);
});

describe("mode - create", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.create({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("redirects to /home if the user already has a household when trying to create", async () => {
        const formData = new FormData();
        formData.append("household_name", "Poudlard");
        const request = new Request("http://localhost/house/create", {
            method: 'POST',
            body: formData
        });
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };

        // On simule que l'utilisateur a déjà un foyer
        (userHasHouse as any).mockResolvedValue(true);

        await expect(
            actions.create({ request, locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
    });
    it("rejects if the household_name field is not provided", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the household name is empty", async () => {
        const formData = new FormData();
        formData.append("household_name", "");
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the household name is longer than 60 characters", async () => {
        const formData = new FormData();
        formData.append("household_name", "A".repeat(61));
        const request = new Request("http://localhost/house/create", {
            method: "POST",
            body: formData
        });
        const locals = { user: { id: 1 } };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: {
                error: "Le nom du foyer ne peut pas dépasser 60 caractères"
            }
        });
        expect(prisma.house.create).not.toHaveBeenCalled();
    });
    it("creates the household when everything is valid", async () => {
        const formData = new FormData();
        formData.append("household_name", "Poudlard");
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        (generateCode as any).mockReturnValue("LUMOS-42");
        (prisma.house.create as any).mockResolvedValue({ id: 1, code: "LUMOS-42" });

        await expect(
            actions.create({ request, locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/new_house"
        });

        expect(prisma.house.create).toHaveBeenCalledWith({
            data: {
                houseName: "Poudlard",
                creatorId: 1,
                code: "LUMOS-42",
                members: {
                    connect: { id: 1 }
                }
            }
        });
    });
    it("regenerates a code on collision (P2002) then creates the household", async () => {
        const formData = new FormData();
        formData.append("household_name", "Poudlard");
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        (generateCode as any)
            .mockReturnValueOnce("LUMOS-42")
            .mockReturnValueOnce("NOX-7");

        const collisionError = new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            { code: "P2002", clientVersion: "6.19.3" }
        );
        (prisma.house.create as any)
            .mockRejectedValueOnce(collisionError)
            .mockResolvedValueOnce({ id: 1, code: "NOX-7" });

        await expect(
            actions.create({ request, locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/new_house"
        });

        expect(prisma.house.create).toHaveBeenCalledTimes(2);
        expect(prisma.house.create).toHaveBeenLastCalledWith({
            data: {
                houseName: "Poudlard",
                creatorId: 1,
                code: "NOX-7",
                members: {
                    connect: { id: 1 }
                }
            }
        });
    });
    it("rethrows the error if it's not a code collision (P2002)", async () => {
        const formData = new FormData();
        formData.append("household_name", "Poudlard");
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        (generateCode as any).mockReturnValue("LUMOS-42");

        const dbError = new Error("Connexion à la base perdue");
        (prisma.house.create as any).mockRejectedValue(dbError);

        await expect(
            actions.create({ request, locals } as any)
        ).rejects.toBe(dbError);

        expect(prisma.house.create).toHaveBeenCalledTimes(1);
    });
    it("rethrows the error if it's a Prisma error with a code other than P2002", async () => {
        const formData = new FormData();
        formData.append("household_name", "Poudlard");
        const request = new Request("http://localhost/house/create",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        (generateCode as any).mockReturnValue("LUMOS-42");

        const otherError = new Prisma.PrismaClientKnownRequestError(
            "Some other constraint failed",
            { code: "P2003", clientVersion: "6.19.3" }
        );
        (prisma.house.create as any).mockRejectedValue(otherError);

        await expect(
            actions.create({ request, locals } as any)
        ).rejects.toBe(otherError);

        expect(prisma.house.create).toHaveBeenCalledTimes(1);
    });
});

describe("mode - join", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.join({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("redirects to /home if the user already has a household when trying to join", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join", {
            method: 'POST',
            body: formData
        });
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };

        // On simule que l'utilisateur a déjà un foyer
        (userHasHouse as any).mockResolvedValue(true);

        await expect(
            actions.join({ request, locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });
    });
    it("rejects if the code field is not provided", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };
        const result = await actions.join({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the code is empty (only spaces)", async () => {
        const formData = new FormData();
        formData.append("code", "   ");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };
        const result = await actions.join({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("responds with 404 if the code doesn't match any household", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };
        (prisma.house.findUnique as any).mockResolvedValue(null);

        const result = await actions.join({ request, locals } as any);
        expect(prisma.house.findUnique).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            include: {
                members: {
                    select: {
                        id: true,
                        role: true,
                    }
                }
            }
        });
        expect(result).toEqual({
            status: 404,
            data: { error: "Ce code ne correspond à aucun foyer." }
        });
    });
    it("responds with 404 if the user is already on the waiting list", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };
        (prisma.house.findUnique as any).mockResolvedValue({ code: "LUMOS-42" });
        (prisma.house.findFirst as any).mockResolvedValueOnce({ code: "LUMOS-42" });

        const result = await actions.join({ request, locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { code: "LUMOS-42", pendingMembers: { some: { id: 1 } } }
        });
        expect(result).toEqual({
            status: 404,
            data: { error: "Vous êtes déjà dans la liste d'attente" }
        });
    });
    it("responds with 404 if the user is already a member of the household", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1, email: "harry@hogwarts.com" } };
        (prisma.house.findUnique as any).mockResolvedValue({ code: "LUMOS-42" });
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ code: "LUMOS-42" });

        const result = await actions.join({ request, locals } as any);
        expect(prisma.house.findFirst).toHaveBeenLastCalledWith({
            where: { code: "LUMOS-42", members: { some: { id: 1 } } }
        });
        expect(result).toEqual({
            status: 404,
            data: { error: "Vous êtes déjà membre de ce foyer." }
        });
    });
    it("joins the household directly if the user was invited", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                email: "Harry@Hogwarts.com",
                username: "Harry"
            }
        };
        (prisma.house.findUnique as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            members: [
                { id: 2, role: Role.HEADMASTER },
                { id: 3, role: Role.TEACHER },
                { id: 4, role: Role.STUDENT }
            ]
        });
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue({ id: 5, email: "harry@hogwarts.com", houseCode: "LUMOS-42" });

        await expect(
            actions.join({ request, locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/home"
        });

        expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
            where: { email_houseCode: { email: "harry@hogwarts.com", houseCode: "LUMOS-42" } }
        });
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: {
                members: {
                    connect: { id: 1 }
                }
            }
        });
        expect(prisma.invitation.delete).toHaveBeenCalledWith({ where: { id: 5 } });
        // Notifies every existing household member when the invited user joins.
        expect(prisma.notification.create).toHaveBeenCalledTimes(3);

        for (const userId of [2, 3, 4]) {
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    type: "INVITATION",
                    title: "Nouveau membre dans le foyer",
                    message: 'Harry a rejoint le foyer "Poudlard".',
                    href: "/house"
                }
            });
        }
    });
    it("adds the user to the waiting list if no invitation exists", async () => {
        const formData = new FormData();
        formData.append("code", "LUMOS-42");
        const request = new Request("http://localhost/house/join",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                email: "harry@hogwarts.com",
                username: "Harry"
            }
        };

        (prisma.house.findUnique as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            creatorId: 2,
            members: [
                { id: 2, role: Role.HEADMASTER },
                { id: 3, role: Role.TEACHER },
                { id: 4, role: Role.STUDENT }
            ]
        });
        (prisma.house.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        (prisma.invitation.findUnique as any).mockResolvedValue(null);

        const result = await actions.join({ request, locals } as any);

        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "LUMOS-42" },
            data: {
                pendingMembers: {
                    connect: { id: 1 }
                }
            }
        });
        expect(prisma.invitation.delete).not.toHaveBeenCalled();
        expect(prisma.notification.create).toHaveBeenCalledTimes(2);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 2,
                type: 'INVITATION',
                title: 'Nouvelle demande pour rejoindre ton foyer',
                message: 'Harry souhaite rejoindre le foyer "Poudlard".',
                href: '/manage_house'
            }
        });

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 3,
                type: 'INVITATION',
                title: 'Nouvelle demande pour rejoindre ton foyer',
                message: 'Harry souhaite rejoindre le foyer "Poudlard".',
                href: '/manage_house'
            }
        });

        expect(prisma.notification.create).not.toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 4
                })
            })
        );
        expect(result).toEqual({ success: true });
    });
});

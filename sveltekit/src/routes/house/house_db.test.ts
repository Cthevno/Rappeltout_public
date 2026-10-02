import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { prisma } from "$lib/server/prisma";
import { actions } from "./[mode]/+page.server";
import { actions as house_actions, load } from "./+page.server";

vi.mock("$lib/server/prisma", () => ({
    prisma: {
        house: {
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn()
        },
        invitation: {
            findFirst: vi.fn(),
            create: vi.fn()
        },
        notification: {
            create: vi.fn()
        },
        user: {
            update: vi.fn(),
            findFirst: vi.fn()
        },
        $transaction: vi.fn()
    }
}));

vi.mock("$lib/generateCode.js", () => ({
    generateCode: vi.fn(() => "TEST-123")
}));

vi.mock("$lib/server/email.js", () => ({
    sendMail: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (prisma.house.create as any).mockReturnValue({});
    (prisma.user.update as any).mockReturnValue({});
    (prisma.$transaction as any).mockResolvedValue([]);
});

describe("house roles", () => {
    it("assigns HEADMASTER role to the house creator", async () => {
        const formData = new FormData();
        formData.set("household_name", "Hogwarts");

        const request = new Request("http://localhost/house/create", {
            method: "POST",
            body: formData
        });

        await expect(
            actions.create({
                request,
                locals: {
                    user: {
                        id: 1,
                        username: "Harry"
                    }
                }
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/new_house"
        });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { role: Role.HEADMASTER }
        });
    });

    it("refuses house invitation by STUDENT", async () => {
        const formData = new FormData();
        formData.set("email", "student@example.com");

        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });

        const result = await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    role: Role.STUDENT
                }
            }
        } as any);

        expect(result).toMatchObject({
            status: 403,
            data: { error: "Action non autorisée" }
        });

        expect(prisma.house.findFirst).not.toHaveBeenCalled();
        expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

    it("creates an invitation for a new household member", async () => {
        const formData = new FormData();
        formData.set("email", "newmember@example.com");
        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts"
        });
        // The email does not belong to an existing or pending member.
        (prisma.user.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        // No invitation exists yet for this email.
        (prisma.invitation.findFirst as any).mockResolvedValue(null);
        await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    role: Role.HEADMASTER
                }
            }
        } as any);
        // Creates an invitation linked to the current household.
        expect(prisma.invitation.create).toHaveBeenCalledWith({
            data: {
                email: "newmember@example.com",
                houseCode: "TEST-123"
            }
        });
    });
    it("notifies an existing user when invited to a household", async () => {
        const formData = new FormData();
        formData.set("email", "existing@example.com");

        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts"
        });

        // The user exists but is neither a member nor a pending member.
        (prisma.user.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 2,
                username: "Hermione",
                email: "existing@example.com"
            });

        (prisma.invitation.findFirst as any).mockResolvedValue(null);
        (prisma.notification.create as any).mockResolvedValue({});

        await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    username: "Harry",
                    role: Role.HEADMASTER
                }
            }
        } as any);

        // Notifies the existing user about the household invitation.
        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 2,
                type: "INVITATION",
                title: "Invitation à rejoindre Hogwarts",
                message: "Harry t’invite à rejoindre son foyer. Code : TEST-123",
                href: "/house/join"
            }
        });
    });

    it("refuses invitation when the email already belongs to a household member", async () => {
        const formData = new FormData();
        formData.set("email", "member@example.com");
        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts"
        });
        // The email already belongs to a member of the current household.
        (prisma.user.findFirst as any).mockResolvedValueOnce({
            id: 2,
            email: "member@example.com"
        });
        const result = await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    role: Role.HEADMASTER
                }
            }
        } as any);
        expect(result).toMatchObject({
            status: 400,
            data: {
                error: "Cette adresse mail est déjà utilisée dans ce foyer"
            }
        });
        // No invitation should be created for an existing member.
        expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

    it("accepts a pending member into the household", async () => {
        const formData = new FormData();
        formData.set("email", "pending@example.com");
        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts"
        });
        // The email is not already a member.
        (prisma.user.findFirst as any)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 2,
                email: "pending@example.com"
            });
        (prisma.house.update as any).mockResolvedValue({});
        const result = await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    role: Role.HEADMASTER
                }
            }
        } as any);
        // Moves the user from the pending list to the household members.
        expect(prisma.house.update).toHaveBeenCalledWith({
            where: { code: "TEST-123" },
            data: {
                pendingMembers: { disconnect: { id: 2 } },
                members: { connect: { id: 2 } }
            }
        });
        expect(result).toEqual({
            success: true
        });
    });

    it("refuses invitation when the email is too long", async () => {
        const formData = new FormData();
        formData.set("email", `${"a".repeat(101)}@example.com`);

        const request = new Request("http://localhost/house", {
            method: "POST",
            body: formData
        });
        const result = await house_actions.inviteMember({
            request,
            locals: {
                user: {
                    id: 1,
                    role: Role.HEADMASTER
                }
            }
        } as any);
        // Refuses an email longer than the allowed maximum length.
        expect(result).toMatchObject({
            status: 400,
            data: {
                error: "Email trop long !"
            }
        });
        expect(prisma.house.findFirst).not.toHaveBeenCalled();
        expect(prisma.invitation.create).not.toHaveBeenCalled();
    });

});

describe("house - load", () => {
    it("returns the household data and members", async () => {
        const createdAt = new Date("2026-09-10");

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "TEST-123",
            houseName: "Hogwarts",
            createdAt,
            members: [
                {
                    id: 1,
                    username: "Harry",
                    totalXP: 50,
                    avatar: "wizard",
                    role: Role.HEADMASTER
                },
                {
                    id: 2,
                    username: "Ron",
                    totalXP: 15,
                    avatar: "wizard",
                    role: Role.STUDENT
                }
            ]
        });

        const result = await load({
            locals: {
                user: {
                    id: 1,
                    role: Role.HEADMASTER
                }
            }
        } as any);

        expect(result).toMatchObject({
            code: "TEST-123",
            houseName: "Hogwarts",
            houseCreationDate: createdAt,
            members: [
                {
                    id: 1,
                    username: "Harry",
                    totalXP: 50,
                    role: Role.HEADMASTER
                },
                {
                    id: 2,
                    username: "Ron",
                    totalXP: 15,
                    role: Role.STUDENT
                }
            ],
            current_user: {
                id: 1,
                role: Role.HEADMASTER
            }
        });
    });

    it("redirects to /house/create when the user has no household", async () => {
        (prisma.house.findFirst as any).mockResolvedValue(null);

        await expect(
            load({
                locals: {
                    user: {
                        id: 1,
                        role: Role.STUDENT
                    }
                }
            } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/house/create"
        });
    });
});
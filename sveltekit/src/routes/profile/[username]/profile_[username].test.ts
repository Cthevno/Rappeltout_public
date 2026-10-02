import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma';
import { getIO } from '$lib/server/socketInstance';
import { HomeUpdate } from '$lib/server/homeWebSockets';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        house: {
            findFirst: vi.fn(),
        }
    }
}));

vi.mock('$lib/server/socketInstance', () => ({
    getIO: vi.fn(),
}));

vi.mock('$lib/server/homeWebSockets', () => ({
    HomeUpdate: vi.fn(),
}));

vi.mock('$lib/avatars', () => ({
    AVAILABLE_AVATARS: [
        { path: 'wizard.png' },
        { path: 'toad.png' },
    ]
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("profile page - load", () => {

    it("redirects to /auth/welcome if user isn't connected", async () => {
        await expect(
            load({ params: { username: 'John' }, locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("decodes the username before querying prisma", async () => {
        const locals = { user: { id: 1 } };
        (prisma.user.findFirst as any).mockResolvedValue(null);

        await expect(
            load({ params: { username: 'John%20Doe' }, locals } as any)
        ).rejects.toMatchObject({ status: 404 });

        expect(prisma.user.findFirst).toHaveBeenCalledWith({
            where: { username: 'John Doe' },
            select: {
                id: true,
                username: true,
                avatar: true,
                sharedTasksCompleted: true,
                totalDmgDealt: true,
                monstersSlayed: true,
                totalXP: true
            }
        });
    });

    it("throws error 404 'user_not_found' if the username doesn't exist", async () => {
        const locals = { user: { id: 1 } };
        (prisma.user.findFirst as any).mockResolvedValue(null);

        await expect(
            load({ params: { username: 'Ghost' }, locals } as any)
        ).rejects.toMatchObject({
            status: 404,
            body: { message: 'user_not_found' }
        });
    });

    it("throws error 403 if the target profile doesn't share a house with the caller", async () => {
        const locals = { user: { id: 1 } };
        const targetUser = {
            id: 2,
            username: 'Jane',
            avatar: 'toad.png',
            sharedTasksCompleted: 3,
            totalDmgDealt: 100,
            monstersSlayed: 1,
            totalXP: 200
        };
        (prisma.user.findFirst as any).mockResolvedValue(targetUser);
        (prisma.house.findFirst as any).mockResolvedValue(null);

        await expect(
            load({ params: { username: 'Jane' }, locals } as any)
        ).rejects.toMatchObject({
            status: 403,
            body: { message: 'Vous ne pouvez voir que les profils des membres de votre foyer' }
        });
    });

    it("returns a minimal payload { houseCode: null } when viewing your own profile without a house", async () => {
        const locals = { user: { id: 1 } };
        const ownUser = {
            id: 1,
            username: 'John',
            avatar: 'wizard.png',
            sharedTasksCompleted: 0,
            totalDmgDealt: 0,
            monstersSlayed: 0,
            totalXP: 0
        };
        (prisma.user.findFirst as any).mockResolvedValue(ownUser);
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await load({ params: { username: 'John' }, locals } as any);

        expect(result).toEqual({ houseCode: null });
    });

    it("returns the full profile payload when viewing your own profile within a house", async () => {
        const locals = { user: { id: 1 } };
        const ownUser = {
            id: 1,
            username: 'John',
            avatar: 'wizard.png',
            sharedTasksCompleted: 5,
            totalDmgDealt: 300,
            monstersSlayed: 2,
            totalXP: 1500
        };
        const fakeHouse = { code: 'IMPERO-367' };
        (prisma.user.findFirst as any).mockResolvedValue(ownUser);
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const result = await load({ params: { username: 'John' }, locals } as any);

        expect(result).toEqual({
            seo: {
                title: "Mon profil | Rappeltout",
                description: "Consulte ton profil, ton niveau, tes statistiques et modifie ton avatar sur Rappeltout."
            },
            userInfos: {
                id: 1,
                username: 'John',
                avatar: 'wizard.png',
                sharedTasksCompleted: 5,
                totalDmgDealt: 300,
                monstersSlayed: 2,
                totalXP: 1500
            },
            houseCode: 'IMPERO-367',
            isOwnProfile: true
        });
    });

    it("returns the full profile payload when viewing another member's profile within the same house", async () => {
        const locals = { user: { id: 1 } };
        const targetUser = {
            id: 2,
            username: 'Jane',
            avatar: 'toad.png',
            sharedTasksCompleted: 8,
            totalDmgDealt: 500,
            monstersSlayed: 4,
            totalXP: 3000
        };
        const fakeHouse = { code: 'IMPERO-367' };
        (prisma.user.findFirst as any).mockResolvedValue(targetUser);
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);

        const result = await load({ params: { username: 'Jane' }, locals } as any);

        expect(result).toEqual({
            seo: {
                title: "Profil de Jane | Rappeltout",
                description: "Consulte le profil de Jane, son niveau et ses statistiques sur Rappeltout."
            },
            userInfos: {
                id: 2,
                username: 'Jane',
                avatar: 'toad.png',
                sharedTasksCompleted: 8,
                totalDmgDealt: 500,
                monstersSlayed: 4,
                totalXP: 3000
            },
            houseCode: 'IMPERO-367',
            isOwnProfile: false
        });
    });

    it("queries the house scoped to both the caller and the target user", async () => {
        const locals = { user: { id: 1 } };
        const targetUser = {
            id: 2,
            username: 'Jane',
            avatar: 'toad.png',
            sharedTasksCompleted: 0,
            totalDmgDealt: 0,
            monstersSlayed: 0,
            totalXP: 0
        };
        (prisma.user.findFirst as any).mockResolvedValue(targetUser);
        (prisma.house.findFirst as any).mockResolvedValue({ code: 'IMPERO-367' });

        await load({ params: { username: 'Jane' }, locals } as any);

        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: {
                AND: [
                    { members: { some: { id: 1 } } },
                    { members: { some: { id: 2 } } }
                ]
            }
        });
    });
});

describe("profile page - actions updateUserAvatar", () => {

    it("redirects to /auth/welcome if user isn't connected", async () => {
        const request = { formData: async () => new FormData() };

        await expect(
            actions.updateUserAvatar({ request, locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("returns fail 400 if newAvatar is missing", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        const request = { formData: async () => formData };

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 400,
            data: { error: "Missing or invalid data" }
        });
    });

    it("returns fail 400 if newAvatar isn't a string (e.g. a File)", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', new Blob(['fake']), 'avatar.png');
        const request = { formData: async () => formData };

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 400,
            data: { error: "Missing or invalid data" }
        });
    });

    it("returns fail 400 if newAvatar isn't part of AVAILABLE_AVATARS", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'unknown-avatar.png');
        const request = { formData: async () => formData };

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 400,
            data: { error: "This avatar isn't available" }
        });
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("successfully updates the avatar and returns success: true", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'wizard.png');
        const request = { formData: async () => formData };

        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { avatar: 'wizard.png' }
        });
        expect(result).toEqual({ success: true, avatar: 'wizard.png' });
    });

    it("does not attempt to notify via websocket if the user has no house", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'toad.png');
        const request = { formData: async () => formData };

        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(null);

        await actions.updateUserAvatar({ request, locals } as any);

        expect(getIO).not.toHaveBeenCalled();
        expect(HomeUpdate).not.toHaveBeenCalled();
    });

    it("notifies the house via websocket when the user belongs to one and IO is available", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'toad.png');
        const request = { formData: async () => formData };

        const fakeHouse = { code: 'IMPERO-367' };
        const fakeIO = {};
        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        (getIO as any).mockReturnValue(fakeIO);

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { members: { some: { id: 1 } } }
        });
        expect(HomeUpdate).toHaveBeenCalledWith(fakeIO, 'IMPERO-367');
        expect(result).toEqual({ success: true, avatar: 'toad.png' });
    });

    it("does not call HomeUpdate if the user has a house but IO isn't available", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'toad.png');
        const request = { formData: async () => formData };

        const fakeHouse = { code: 'IMPERO-367' };
        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        (getIO as any).mockReturnValue(null);

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(HomeUpdate).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, avatar: 'toad.png' });
    });

    it("returns fail 500 if a database error occurs during the avatar update", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'wizard.png');
        const request = { formData: async () => formData };

        (prisma.user.update as any).mockRejectedValue(new Error("DB crash"));

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 500,
            data: { error: "Internal server error" }
        });
    });

    it("returns fail 500 if a database error occurs while looking up the house", async () => {
        const locals = { user: { id: 1 } };
        const formData = new FormData();
        formData.append('newAvatar', 'wizard.png');
        const request = { formData: async () => formData };

        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockRejectedValue(new Error("DB crash"));

        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 500,
            data: { error: "Internal server error" }
        });
    });
});
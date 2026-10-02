import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma'
import { AVAILABLE_AVATARS } from '$lib/avatars';
import { HomeUpdate } from '$lib/server/homeWebSockets';
import { getIO } from '$lib/server/socketInstance';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        house: {
            findFirst: vi.fn(),
        }
    }
}));

vi.mock('$lib/server/socketInstance', () => ({
    getIO: vi.fn(() => null),
}));

vi.mock('$lib/server/homeWebSockets', () => ({
    HomeUpdate: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("profile page - load", () => {

    it("redirect to /auth/welcome if user isn't connected", async () => {
    await expect(
        load({ locals: { user: null } } as any)
    ).rejects.toMatchObject({
        status: 303,
        location: "/auth/welcome"
    });
    });

    it("redirect to /auth/welcome if user has been removed from DB", async () => {
        const locals = { user: { id: 1 } };
        (prisma.user.findUnique as any).mockResolvedValue(null);
        await expect(
            load({ locals } as any)).rejects.toMatchObject({
                status: 303,
                location: "/auth/welcome"
            });
    });

    it("returns houseCode: null if user has no household", async () => {
        const locals = { user: { id: 1 } };
        const fakeUserInfos = {
            username: "Harry",
            avatar: "/avatars/wizard.png",
            sharedTasksCompleted: 5,
            totalDmgDealt: 100,
            monstersSlayed: 2,
            totalXP: 250
        };
        (prisma.user.findUnique as any).mockResolvedValue(fakeUserInfos);
        (prisma.house.findFirst as any).mockResolvedValue(null);
        const result = await load({ locals } as any);
        expect(result).toEqual({
            seo: {
                title: 'Mon profil | Rappeltout',
                description: 'Consulte ton profil, ton level, tes statistiques et modifie ton avatar sur Rappeltout.'
            },
            userInfos: fakeUserInfos,
            houseCode: null
        })
    });

    it("returns houseCode, userInfos and seo when user belongs to a household", async () => {
        const locals = { user: { id: 1 } };
        const fakeUserInfos = {
            username: "Harry",
            avatar: "/avatars/wizard.png",
            sharedTasksCompleted: 5,
            totalDmgDealt: 100,
            monstersSlayed: 2,
            totalXP: 250
        };
        const fakeHouse = { code: "LUMOS-42" };
        (prisma.user.findUnique as any).mockResolvedValue(fakeUserInfos);
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        const result = await load({ locals } as any);
        expect(result).toEqual({
            seo: {
                title: 'Mon profil | Rappeltout',
                description: 'Consulte ton profil, ton level, tes statistiques et modifie ton avatar sur Rappeltout.'
            },
            userInfos: fakeUserInfos,
            houseCode: "LUMOS-42"
        })
    });
});

function createMockRequest(formDataMap: Record<string, any>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(formDataMap)) {
        formData.append(key, value);
    }
    return {
        request: {
            formData: async () => formData
        }
    };
}

describe("profile page - actions.updateUserAvatar", () => {
    
    it("redirect to /auth/welcome if user isn't connected", async () => {
        await expect(
            actions.updateUserAvatar({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("fails with 400 if rawAvatar is missing or not a string", async () => {
        const locals = { user: { id: 1 } };
        const { request } = createMockRequest({});
        const result = await actions.updateUserAvatar({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Missing or invalid data"}
        });
    });

    it("fails with 400 if avatar is not in AVAILABLE_AVATARS", async () => {
        const locals = { user: { id: 1 } };
        const { request } = createMockRequest({ newAvatar: '/avatars/unknown_avatar.png'});
        const result = await actions.updateUserAvatar({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "This avatar isn't available"}
        });
    });
    
    it("successfully updates avatar and emits websocket event if house is found", async () => {
        const locals = { user: { id: 1 } };
        const validAvatar = AVAILABLE_AVATARS[0].path;
        const fakeHouse = { code: 'HOUSE-123' };
        const mockIo = { emit: vi.fn() };

        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        (getIO as any).mockReturnValue(mockIo);

        const { request } = createMockRequest({ newAvatar: validAvatar });
        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { avatar: validAvatar }
        });
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: { members: { some: { id: 1 } } }
        });

        expect(HomeUpdate).toHaveBeenCalledWith(mockIo, fakeHouse.code);

        expect(result).toEqual({ success: true, avatar: validAvatar });
    });

    it("successfully updates avatar but does NOT emit websocket event if user has no house", async () => {
        const locals = { user: { id: 1 } };
        const validAvatar = AVAILABLE_AVATARS[0].path;

        (prisma.user.update as any).mockResolvedValue({});
        (prisma.house.findFirst as any).mockResolvedValue(null); // Pas de foyer

        const { request } = createMockRequest({ newAvatar: validAvatar });
        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { avatar: validAvatar }
        });

        expect(HomeUpdate).not.toHaveBeenCalled();

        expect(result).toEqual({ success: true, avatar: validAvatar });
    });

    it("returns 500 when prisma.user.update throws an error", async () => {
        const locals = { user: { id: 1 } };
        const validAvatar = AVAILABLE_AVATARS[0].path;

        (prisma.user.update as any).mockRejectedValue(new Error("Database failure"));

        const { request } = createMockRequest({ newAvatar: validAvatar });
        const result = await actions.updateUserAvatar({ request, locals } as any);

        expect(result).toEqual({
            status: 500,
            data: { error: "Internal server error" }
        });
    });
});


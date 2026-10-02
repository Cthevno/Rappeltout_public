import { vi, describe, it, expect, beforeEach } from 'vitest';
import { load } from './+page.server'
import { prisma } from '$lib/server/prisma'

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        house: {
            findFirst: vi.fn(),
        }
    }
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("new_house - load", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            load({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("returns the household correctly", async () => {
        const locals = { user: { id: 1, username: "Harry" } };
        const fakeHouse = { code: "IMPERO-78", houseName: "Poudlard", creatorId: "1" };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        const result = await load({ locals } as any);

        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: {
                OR: [
                    { creatorId: 1 },
                    { members: { some: { id: 1 } } }
                ]
            }
        });
        expect(result).toEqual({
            code: "IMPERO-78",
            username: "Harry",
            houseName: "Poudlard",
            seo: { title: "Nouveau foyer - Rappeltout" }
        });
    })
    it("redirects to /house if the user doesn't have a household yet", async () => {
        const locals = { user: { id: 1, username: "Harry" } };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        await expect(
            load({ locals } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/house"
        });
    })
});
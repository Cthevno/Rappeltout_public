import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "$lib/server/prisma";
import { load } from "./+page.server";

vi.mock("$lib/server/prisma", () => ({
    prisma: {
        notification: {
            findMany: vi.fn(),
        },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("notifications - load", () => {
    it("returns the user's notifications ordered by creation date", async () => {
        const notifications = [
            {
                id: 2,
                userId: 1,
                title: "Deuxième notification",
                createdAt: new Date("2026-09-13"),
            },
            {
                id: 1,
                userId: 1,
                title: "Première notification",
                createdAt: new Date("2026-09-12"),
            },
        ];

        (prisma.notification.findMany as any).mockResolvedValue(notifications);

        const result = await load({
            locals: {
                user: {
                    id: 1,
                },
            },
        } as any);

        // Fetches only the authenticated user's notifications,
        // with the most recent notifications displayed first.
        expect(prisma.notification.findMany).toHaveBeenCalledWith({
            where: {
                userId: 1,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Returns the notifications and the page SEO data.
        expect(result).toEqual({
            notifications,
            seo: {
                title: "Notifications — Rappeltout",
            },
        });
    });

    it("redirects unauthenticated users to /auth/welcome", async () => {
        await expect(
            load({
                locals: {
                    user: null,
                },
            } as any),
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome",
        });

        // No database query should be made for an unauthenticated user.
        expect(prisma.notification.findMany).not.toHaveBeenCalled();
    });
});
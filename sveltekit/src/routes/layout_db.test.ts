import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "$lib/server/prisma";
import { load } from "./+layout.server";

vi.mock("$lib/server/prisma", () => ({
    prisma: {
        notification: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

describe("root layout - notifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads only the 50 latest notifications and counts all unread notifications", async () => {
        (prisma.notification.findMany as any).mockResolvedValue([]);
        (prisma.notification.count as any).mockResolvedValue(125);

        const locals = {
            user: {
                id: 42,
                theme: "PARCHMENT",
            },
        };

        const result = await load({ locals } as any);

        // Loads only the latest 50 notifications for the dropdown.
        expect(prisma.notification.findMany).toHaveBeenCalledWith({
            where: {
                userId: 42,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        // Counts all unread notifications independently from the dropdown limit.
        expect(prisma.notification.count).toHaveBeenCalledWith({
            where: {
                userId: 42,
                isRead: false,
            },
        });

        expect(result).toEqual({
            theme: "parchment",
            notifications: [],
            unreadCount: 125,
        });
    });
});
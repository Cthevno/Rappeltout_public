/**
 * @file +layout.server.ts
 * @brief Provides global user theme data to the root layout.
 */

import { prisma } from "$lib/server/prisma";
export async function load({ locals }) {
    if (!locals.user) {
        return {
            theme: "parchment",
            notifications: [],
            unreadCount: 0,
        };
    }

    const notifications = await prisma.notification.findMany({
        where: {
            userId: locals.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 50,
    });

    const unreadCount = await prisma.notification.count({
        where: {
            userId: locals.user.id,
            isRead: false,
        },
    });

    return {
        theme: (locals.user.theme ?? "PARCHMENT").toLowerCase(),
        notifications,
        unreadCount,
    };
}
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function load({ locals }) {
    if (!locals.user)
        throw redirect(303, '/auth/welcome');

    const notifications = await prisma.notification.findMany({
        where: {
            userId: locals.user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return {
        notifications,
        seo: {
            title: 'Notifications — Rappeltout'
        }
    };
}
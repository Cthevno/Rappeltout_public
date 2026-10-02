import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

/**
 * @brief Marks one or all notifications as read.
 *
 * @details
 * If body.all is true, every unread notification belonging
 * to the authenticated user is marked as read.
 *
 * Otherwise, body.id must contain the identifier of one
 * notification belonging to the authenticated user.
 */
export async function PATCH({ request, locals }) {

    if (!locals.user) {
        return json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }

    if (
        typeof body !== 'object' ||
        body === null
    ) {
        return json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }

    // Mark every notification as read
    if (
        'all' in body &&
        body.all === true
    ) {
        await prisma.notification.updateMany({
            where: {
                userId: locals.user.id,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        return json({
            success: true
        });
    }

    // Mark one notification as read
    if (
        !('id' in body) ||
        typeof body.id !== 'number'
    ) {
        return json(
            { error: 'Invalid notification id' },
            { status: 400 }
        );
    }

    const notification = await prisma.notification.findFirst({
        where: {
            id: body.id,
            userId: locals.user.id
        }
    });

    if (!notification) {
        return json(
            { error: 'Notification not found' },
            { status: 404 }
        );
    }

    await prisma.notification.update({
        where: {
            id: notification.id
        },
        data: {
            isRead: true
        }
    });

    return json({
        success: true
    });
}

/**
 * @brief Deletes one notification belonging to the authenticated user.
 *
 * @details
 * body.id must contain the identifier of a notification
 * belonging to the authenticated user.
 */
export async function DELETE({ request, locals }) {

    if (!locals.user) {
        return json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }

    if (
        typeof body !== 'object' ||
        body === null ||
        !('id' in body) ||
        typeof body.id !== 'number'
    ) {
        return json(
            { error: 'Invalid notification id' },
            { status: 400 }
        );
    }

    const notification = await prisma.notification.findFirst({
        where: {
            id: body.id,
            userId: locals.user.id
        }
    });

    if (!notification) {
        return json(
            { error: 'Notification not found' },
            { status: 404 }
        );
    }

    await prisma.notification.delete({
        where: {
            id: notification.id
        }
    });

    return json({
        success: true
    });
}
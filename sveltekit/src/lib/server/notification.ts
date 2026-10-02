import { prisma } from '$lib/server/prisma';
import type { NotificationType } from '@prisma/client';
import { emitNotificationUpdate } from '$lib/server/notificationsWebSockets';

/**
 * @brief Creates a notification for one user.
 *
 * @param user_id User who will receive the notification.
 * @param type Notification category.
 * @param title Notification title.
 * @param message Notification message.
 * @param href Optional path to the page related to the notification.
 */
export async function create_notification(
    user_id: number,
    type: NotificationType,
    title: string,
    message: string,
    href?: string | null
) {
    const notification = await prisma.notification.create({
        data: {
            userId: user_id,
            type,
            title,
            message,
            href: href ?? null
        }
    });

    emitNotificationUpdate(user_id);

    return notification;
}
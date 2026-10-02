import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './+server';
import { prisma } from '$lib/server/prisma';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        notification: {
            findFirst: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            delete: vi.fn()
        }
    }
}));

// Tests notification read operations and access control.

describe('Notifications API PATCH', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks one notification belonging to the authenticated user as read', async () => {
        (prisma.notification.findFirst as any).mockResolvedValue({
            id: 10,
            userId: 1,
            isRead: false
        });

        (prisma.notification.update as any).mockResolvedValue({});

        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 10
            })
        });

        const response = await PATCH({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true
        });

        expect(prisma.notification.findFirst).toHaveBeenCalledWith({
            where: {
                id: 10,
                userId: 1
            }
        });

        expect(prisma.notification.update).toHaveBeenCalledWith({
            where: {
                id: 10
            },
            data: {
                isRead: true
            }
        });
    });

    // A user cannot mark another user's notification as read.
    it('refuses to mark another user notification as read', async () => {
        (prisma.notification.findFirst as any).mockResolvedValue(null);

        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 10
            })
        });

        const response = await PATCH({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(404);

        expect(prisma.notification.findFirst).toHaveBeenCalledWith({
            where: {
                id: 10,
                userId: 1
            }
        });

        expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    // Marks all unread notifications belonging to the authenticated user as read.
    it('marks all unread notifications belonging to the authenticated user as read', async () => {
        (prisma.notification.updateMany as any).mockResolvedValue({
            count: 2
        });

        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                all: true
            })
        });

        const response = await PATCH({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true
        });

        expect(prisma.notification.updateMany).toHaveBeenCalledWith({
            where: {
                userId: 1,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
    });

    // An unauthenticated user cannot mark notifications as read.
    it('refuses to mark notifications as read when the user is not authenticated', async () => {
        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 10
            })
        });

        const response = await PATCH({
            request,
            locals: {
                user: null
            }
        } as any);

        expect(response.status).toBe(401);

        expect(prisma.notification.findFirst).not.toHaveBeenCalled();
        expect(prisma.notification.update).not.toHaveBeenCalled();
        expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });

    // Rejects a notification id that is not a number.
    it('rejects an invalid notification id', async () => {
        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 'invalid'
            })
        });

        const response = await PATCH({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'Invalid notification id'
        });

        expect(prisma.notification.findFirst).not.toHaveBeenCalled();
        expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    // Rejects a request body that is not valid JSON.
    it('rejects an invalid request body', async () => {
        const request = new Request('http://localhost/api/notifications', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '{invalid json'
        });

        const response = await PATCH({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'Invalid request body'
        });

        expect(prisma.notification.findFirst).not.toHaveBeenCalled();
        expect(prisma.notification.update).not.toHaveBeenCalled();
        expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });

});

describe('Notifications API DELETE', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes a notification belonging to the authenticated user', async () => {
        (prisma.notification.findFirst as any).mockResolvedValue({
            id: 10,
            userId: 1
        });

        (prisma.notification.delete as any).mockResolvedValue({});

        const request = new Request('http://localhost/api/notifications', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 10
            })
        });

        const response = await DELETE({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true
        });

        expect(prisma.notification.findFirst).toHaveBeenCalledWith({
            where: {
                id: 10,
                userId: 1
            }
        });

        expect(prisma.notification.delete).toHaveBeenCalledWith({
            where: {
                id: 10
            }
        });
    });

    it('refuses to delete another user notification', async () => {
        (prisma.notification.findFirst as any).mockResolvedValue(null);

        const request = new Request('http://localhost/api/notifications', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 10
            })
        });

        const response = await DELETE({
            request,
            locals: {
                user: {
                    id: 1
                }
            }
        } as any);

        expect(response.status).toBe(404);

        expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
});
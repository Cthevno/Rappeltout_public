import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma'
import { Role } from '@prisma/client';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        task: {
            create: vi.fn(),
            deleteMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            findMany: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        }
    }
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("todo - create", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.create({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("rejects if the task field is not even sent", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the task is empty", async () => {
        const formData = new FormData();
        formData.append("task", "");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    })
    it("rejects if the task is longer than 500 characters", async () => {
        const formData = new FormData();
        formData.append("task", "a".repeat(501));
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "La tâche ne doit pas dépasser 500 caractères" }
        });
    });
    it("rejects an invalid deadline", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("date", "a");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Date limite invalide" }
        });
    });
    it("rejects a deadline earlier than today", async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("date", yesterday.toDateString());
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "La date limite ne peut être antérieure à aujourd'hui" }
        });
    });
    it("creates the task when everything is valid", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(prisma.task.create).toHaveBeenCalledWith({
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                userId: 1
            }
        });
        expect(result).toBeUndefined();
    });
    it("create the task with a valid due date (in the future)", async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("date", tomorrow.toISOString());
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.create({ request, locals } as any);
        expect(prisma.task.create).toHaveBeenCalledWith({
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: tomorrow,
                userId: 1
            }
        });
        expect(result).toBeUndefined();
    });
});

describe("todo - check", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.check({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it.each(["-1", "0", "abc"])("rejects an invalid id: %s", async (id) => {
        const formData = new FormData();
        formData.append("id", id);
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        const result = await actions.check({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { taskError: "Identifiant de tâche invalide" }
        });
    });
    it("responds 404 if the task doesn't exist", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = { user: { id: 1 } };
        (prisma.task.findFirst as any).mockResolvedValue(null);
        const result = await actions.check({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { taskError: "Ressource non trouvée" }
        });
    });
    it("marks a task as completed", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/todo", {
            method: "POST",
            body: formData
        });
        const locals = { user: { id: 1 } };
        (prisma.task.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false
        });
        const result = await actions.check({ request, locals } as any);
        expect(prisma.task.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: true,
                finishedAt: expect.any(Date)
            }
        });
        expect(result).toBeUndefined();
    });
    it("marks a completed task as unfinished", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/todo", {
            method: "POST",
            body: formData
        });
        const locals = { user: { id: 1 } };
        (prisma.task.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: true
        });
        const result = await actions.check({ request, locals } as any);
        expect(prisma.task.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: false,
                finishedAt: null
            }
        });
        expect(result).toBeUndefined();
    });
});

describe("todo - delete", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.delete({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it.each(["-1", "0", "abc"])("rejects an invalid id: %s", async (id) => {
        const formData = new FormData();
        formData.append("id", id);
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.delete({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { taskError: "Identifiant de tâche invalide" }
        });
    });
    it("a user cannot delete another user's task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 2,
                role: Role.HEADMASTER
            }
        };
        (prisma.task.deleteMany as any).mockResolvedValue({ count: 0 });
        const result = await actions.delete({ request, locals } as any);
        expect(result).toEqual({ status: 404, data: { taskError: "Ressource non trouvée" } });
    });
    it("a user can delete their own task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.task.deleteMany as any).mockResolvedValue({ count: 1 });
        const result = await actions.delete({ request, locals } as any);
        expect(result).toBeUndefined();
    });
})

describe("todo - deleteChecked", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.deleteChecked({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("deletes the checked tasks", async () => {
        const locals = { user: { id: 1 } };
        await actions.deleteChecked({ locals } as any);
        expect(prisma.task.deleteMany).toHaveBeenCalledWith({
            where: { userId: locals.user.id, isFinish: true }
        });
    });
});

describe("todo - edit", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.edit({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("rejects if the task field is not even sent", async () => {
        const formData = new FormData();
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the task is empty", async () => {
        const formData = new FormData();
        formData.append("task", "");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Champs obligatoires manquants" }
        });
    });
    it("rejects if the task is longer than 500 characters", async () => {
        const formData = new FormData();
        formData.append("task", "a".repeat(501));
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "La tâche ne doit pas dépasser 500 caractères" }
        });
    });
    it("rejects an invalid deadline", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("date", "a");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Date limite invalide" }
        });
    });
    it("rejects a deadline earlier than today", async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("date", yesterday.toDateString());
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "La date limite ne peut être antérieure à aujourd'hui" }
        });
    });
    it.each(["-1", "0", "abc"])("rejects an invalid id: %s", async (id) => {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("task", "Faire les courses");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { taskError: "Identifiant de tâche invalide" }
        });
    });
    it("edits the task when everything is valid", async () => {
        const formData = new FormData();
        formData.append("id", "1");
        formData.append("task", "Sortir les poubelles");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.task.updateMany as any).mockResolvedValue({ count: 1 });
        const result = await actions.edit({ request, locals } as any);
        expect(prisma.task.updateMany).toHaveBeenCalledWith({
            where: {
                id: 1,
                userId: locals.user.id
            },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                overdueNotifiedAt: null,
            }
        });
        expect(result).toBeUndefined();
    });
    it("edit the task with a valid due date (in the future)", async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("id", "1");
        formData.append("task", "Sortir les poubelles");
        formData.append("date", tomorrow.toISOString());
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.task.updateMany as any).mockResolvedValue({ count: 1 });
        const result = await actions.edit({ request, locals } as any);
        expect(prisma.task.updateMany).toHaveBeenCalledWith({
            where: {
                id: 1,
                userId: locals.user.id
            },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: tomorrow,
                overdueNotifiedAt: null,
            }
        });
        expect(result).toBeUndefined();
    });
    it("tries to edit the task but doesn't find it", async () => {
        const formData = new FormData();
        formData.append("id", "1");
        formData.append("task", "Sortir les poubelles");
        const request = new Request("http://localhost/todo",
            {
                method: 'POST',
                body: formData
            })
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        (prisma.task.updateMany as any).mockResolvedValue({ count: 0 });
        const result = await actions.edit({ request, locals } as any);
        expect(prisma.task.updateMany).toHaveBeenCalledWith({
            where: {
                id: 1,
                userId: locals.user.id
            },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                overdueNotifiedAt: null,
            }
        });
        expect(result).toEqual({
            status: 404,
            data: { taskError: "Ressource non trouvée" }
        });
    });
});

describe("todo - load", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            load({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("returns the user's tasks correctly", async () => {
        const locals = { user: { id: 1 } };
        const fakeTasks = [{ id: 1, nameTask: "Sortir les poubelles" }];
        (prisma.task.findMany as any).mockResolvedValue(fakeTasks);

        const result = await load({ locals } as any);

        expect(prisma.task.findMany).toHaveBeenCalledWith({
            where: { userId: 1 }
        });
        expect(result).toEqual({
            tasks: fakeTasks,
            seo: { title: "Mes tâches - Rappeltout" }
        });
    })
    it("notifies the user when a task is overdue", async () => {
        const locals = { user: { id: 1 } };

        const overdueTask = {
            id: 10,
            userId: 1,
            nameTask: "Sortir les poubelles",
            endedAt: new Date("2026-01-01"),
            isFinish: false,
            overdueNotifiedAt: null
        };

        (prisma.task.findMany as any)
            .mockResolvedValueOnce([overdueTask])
            .mockResolvedValueOnce([overdueTask]);

        await load({ locals } as any);

        // Creates a notification for the overdue task.
        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 1,
                type: 'TASK',
                title: 'Tâche en retard',
                message: 'La tâche "Sortir les poubelles" est en retard.',
                href: '/todo'
            }
        });

        // Marks the task to avoid sending the notification again.
        expect(prisma.task.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                overdueNotifiedAt: expect.any(Date)
            }
        });
    });
});

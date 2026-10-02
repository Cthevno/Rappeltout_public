import { vi, describe, it, expect, beforeEach } from 'vitest';
import { actions, load } from './+page.server';
import { prisma } from '$lib/server/prisma'
import { Role } from "@prisma/client";

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        house: {
            findFirst: vi.fn(),
        },
        sharedTask: {
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
            filter: vi.fn(),
        },
        monster: {
            findFirst: vi.fn(),
        },
        notification: {
            create: vi.fn(),
        }

    }
}));

vi.mock('$lib/server/monster', () => ({
    dealDmgForTask: vi.fn(),
    undoDmgTask: vi.fn(),
    activateOrSpawnNextMonster: vi.fn()
}));

vi.mock('$lib/server/profile', () => ({
    updateStatsOnTaskCompleted: vi.fn(),
    undoStatsOnTaskCompleted: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("household_chores - create", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.create({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("allows STUDENT to create a shared task when assigned to it", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "1");
        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [{ id: 1 }, { id: 2 }]
        });
        const result = await actions.create({ request, locals } as any);
        expect(prisma.sharedTask.create).toHaveBeenCalledWith({
            data: {
                houseCode: "LUMOS-42",
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { connect: [{ id: 1 }] }
            }
        });
        expect(result).toBeUndefined();
    });

    it("allows STUDENT to create a shared task assigned to another member", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "2");
        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [{ id: 1 }, { id: 2 }]
        });
        const result = await actions.create({ request, locals } as any);
        expect(prisma.sharedTask.create).toHaveBeenCalledWith({
            data: {
                houseCode: "LUMOS-42",
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { connect: [{ id: 2 }] }
            }
        });
        expect(result).toBeUndefined();
    });

    it("rejects if the task field is not even sent", async () => {
        const formData = new FormData();
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
    it("rejects if the category is not sent", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
    it("rejects if the difficulty is not sent", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        const request = new Request("http://localhost/household_chores",
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
    it("rejects if the task is longer than 500 characters", async () => {
        const formData = new FormData();
        formData.append("task", "a".repeat(501));
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
    it("rejects if the category doesn't match any valid value", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "INVALID");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
            data: { error: "Catégorie ou difficulté invalide" }
        });
    });
    it("rejects if the difficulty doesn't match any valid value", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "INVALID");
        const request = new Request("http://localhost/household_chores",
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
            data: { error: "Catégorie ou difficulté invalide" }
        });
    });
    it("rejects an invalid deadline", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", "a");
        const request = new Request("http://localhost/household_chores",
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
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", yesterday.toDateString());
        const request = new Request("http://localhost/household_chores",
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
    it("responds 404 if the user doesn't have a household", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
    it("rejects if an assignee doesn't belong to the household", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "99");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [{ id: 1 }, { id: 2 }]
        });

        const result = await actions.create({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Assigné(s) invalides(s)" }
        });
    });
    it("creates the task when everything is valid", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [{ id: 1 }, { id: 2 }]
        });

        const result = await actions.create({ request, locals } as any);
        expect(prisma.sharedTask.create).toHaveBeenCalledWith({
            data: {
                houseCode: "LUMOS-42",
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { connect: [] },
            }
        });
        expect(result).toBeUndefined();
    });
    it("creates the task with a valid deadline and valid assignees", async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", tomorrow.toISOString());
        formData.append("assignee", "1");
        formData.append("assignee", "2");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            members: [{ id: 1 }, { id: 2 }]
        });

        const result = await actions.create({ request, locals } as any);
        expect(prisma.sharedTask.create).toHaveBeenCalledWith({
            data: {
                houseCode: "LUMOS-42",
                nameTask: "Sortir les poubelles",
                endedAt: tomorrow,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { connect: [{ id: 1 }, { id: 2 }] },
            }
        });
        expect(result).toBeUndefined();
    });
});

describe("household_chores - check", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.check({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });

    it("allows STUDENT to validate an assigned shared task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false,
            assignees: [{ id: 1 }]
        });
        (prisma.sharedTask.update as any).mockResolvedValue(undefined);
        const result = await actions.check({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: true,
                finishedAt: expect.any(Date)
            }
        });
        expect(result).toBeUndefined();
    });

    it("refuses STUDENT validation of a shared task assigned to another member", async () => {
        const formData = new FormData();
        formData.append("id", "42");

        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false,
            assignees: [{ id: 2 }]
        });

        const result = await actions.check({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { SharedTaskError: "Action non autorisée" }
        });

        expect(prisma.sharedTask.update).not.toHaveBeenCalled();
    });

    it("allows STUDENT validation of an unassigned shared task", async () => {
        const formData = new FormData();
        formData.append("id", "42");

        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false,
            assignees: []
        });

        const result = await actions.check({ request, locals } as any);

        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: true,
                finishedAt: expect.any(Date)
            }
        });

        expect(result).toBeUndefined();
    });

    it.each(["-1", "0", "abc"])("rejects an invalid id: %s", async (id) => {
        const formData = new FormData();
        formData.append("id", id);
        const request = new Request("http://localhost/household_chores",
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
        const result = await actions.check({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { SharedTaskError: "Identifiant de tâche invalide" }
        });
    });
    it("responds 404 if the task doesn't exist in the user's household", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue(null);

        const result = await actions.check({ request, locals } as any);
        expect(prisma.sharedTask.findFirst).toHaveBeenCalledWith({
            where: { id: 42, house: { members: { some: { id: 1 } } } },
            include: { assignees: true }
        });
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
    it("checks a task and sets a finished date", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false,
            assignees: []
        });
        const result = await actions.check({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: true,
                finishedAt: expect.any(Date)
            }
        });
        expect(result).toBeUndefined();
    });
    it("unchecks a task and clears the finished date", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: true,
            assignees: []
        });
        const result = await actions.check({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isFinish: false,
                finishedAt: null
            }
        });
        expect(result).toBeUndefined();
    });
    it("responds 404 if the update fails", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            isFinish: false,
            assignees: []
        });
        (prisma.sharedTask.update as any).mockRejectedValue(new Error("La tâche a été supprimée entre-temps"));
        const result = await actions.check({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
});

describe("household_chores - delete", () => {
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
        const request = new Request("http://localhost/household_chores",
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
            data: { SharedTaskError: "Identifiant de tâche invalide" }
        });
    });
    it("responds 404 if the task doesn't belong to the user's household", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.deleteMany as any).mockResolvedValue({ count: 0 });

        const result = await actions.delete({ request, locals } as any);
        expect(prisma.sharedTask.deleteMany).toHaveBeenCalledWith({
            where: {
                id: 42,
                house: { members: { some: { id: 1 } } }
            }
        });
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
    it("refuses shared task deletion when user lacks permission", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        const result = await actions.delete({ request, locals } as any);
        expect(result).toEqual({
            status: 403,
            data: { SharedTaskError: "Action non autorisée" }
        });
        expect(prisma.sharedTask.deleteMany).not.toHaveBeenCalled();
    });

    it("a household member can delete a shared task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.deleteMany as any).mockResolvedValue({ count: 1 });

        const result = await actions.delete({ request, locals } as any);
        expect(result).toBeUndefined();
    });
});

describe("household_chores - deleteChecked", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            actions.deleteChecked({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("refuses checked shared task deletion when user lacks permission", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        const result = await actions.deleteChecked({ locals } as any);
        expect(result).toEqual({
            status: 403,
            data: { SharedTaskError: "Action non autorisée" }
        });
        expect(prisma.sharedTask.deleteMany).not.toHaveBeenCalled();
    });

    it("deletes the checked tasks in the user's household", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.HEADMASTER
            }
        };
        await actions.deleteChecked({ locals } as any);
        expect(prisma.sharedTask.deleteMany).toHaveBeenCalledWith({
            where: {
                isFinish: true,
                house: { members: { some: { id: 1 } } }
            }
        });
    });
});

describe("household_chores - edit", () => {
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
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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

    it("allows STUDENT to edit an assigned shared task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "1");
        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [{ id: 1 }],
            house: {
                members: [{ id: 1 }, { id: 2 }]
            }
        });
        (prisma.sharedTask.update as any).mockResolvedValue(undefined);
        const result = await actions.edit({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { set: [{ id: 1 }] },
                overdueNotifiedAt: null
            }
        });
        expect(result).toBeUndefined();
    });

    it("allows STUDENT to edit an unassigned shared task", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");

        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [],
            house: {
                members: [{ id: 1 }, { id: 2 }]
            }
        });

        (prisma.sharedTask.update as any).mockResolvedValue(undefined);

        const result = await actions.edit({ request, locals } as any);

        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { set: [] },
                overdueNotifiedAt: null
            }
        });

        expect(result).toBeUndefined();
    });

    it("refuses STUDENT editing when the task is assigned only to another member", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "2");

        const request = new Request("http://localhost/household_chores", {
            method: "POST",
            body: formData
        });

        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };

        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [{ id: 2 }],
            house: {
                members: [{ id: 1 }, { id: 2 }]
            }
        });

        const result = await actions.edit({ request, locals } as any);

        expect(result).toEqual({
            status: 403,
            data: { SharedTaskError: "Action non autorisée" }
        });

        expect(prisma.sharedTask.update).not.toHaveBeenCalled();
    });

    it("rejects if the task is empty", async () => {
        const formData = new FormData();
        formData.append("task", "");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
    it("rejects if the category or difficulty doesn't match any valid value", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "INVALID");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
            data: { error: "Catégorie ou difficulté invalide" }
        });
    });
    it("rejects an invalid deadline", async () => {
        const formData = new FormData();
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", "a");
        const request = new Request("http://localhost/household_chores",
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
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", yesterday.toDateString());
        const request = new Request("http://localhost/household_chores",
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
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
            data: { SharedTaskError: "Identifiant de tâche invalide" }
        });
    });
    it("responds 404 if the task doesn't belong to the user's household", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue(null);

        const result = await actions.edit({ request, locals } as any);
        expect(prisma.sharedTask.findFirst).toHaveBeenCalledWith({
            where: { id: 42, house: { members: { some: { id: 1 } } } },
            include: {
                assignees: {
                    select: { id: true }
                },
                house: {
                    include: {
                        members: { select: { id: true } }
                    }
                }
            }
        });
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
    it("rejects if an assignee doesn't belong to the household", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "99");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [],
            house: { members: [{ id: 1 }, { id: 2 }] }
        });

        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 400,
            data: { error: "Assigné(s) invalides(s)" }
        });
    });
    it("edits the task when everything is valid", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("assignee", "2");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [],
            house: { members: [{ id: 1 }, { id: 2 }] }
        });
        (prisma.sharedTask.update as any).mockResolvedValue(undefined);

        const result = await actions.edit({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: null,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { set: [{ id: 2 }] },
                overdueNotifiedAt: null,
            }
        });
        expect(result).toBeUndefined();
    });
    it("edits the task with a valid deadline (in the future)", async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        formData.append("date", tomorrow.toISOString());
        formData.append("assignee", "2");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [],
            house: { members: [{ id: 1 }, { id: 2 }] }
        });
        (prisma.sharedTask.update as any).mockResolvedValue(undefined);

        const result = await actions.edit({ request, locals } as any);
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                nameTask: "Sortir les poubelles",
                endedAt: tomorrow,
                category: "STUDIES",
                difficulty: "EASY",
                assignees: { set: [{ id: 2 }] },
                overdueNotifiedAt: null,
            }
        });
        expect(result).toBeUndefined();
    });
    it("responds 404 if the update fails", async () => {
        const formData = new FormData();
        formData.append("id", "42");
        formData.append("task", "Sortir les poubelles");
        formData.append("category", "STUDIES");
        formData.append("difficulty", "EASY");
        const request = new Request("http://localhost/household_chores",
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
        (prisma.sharedTask.findFirst as any).mockResolvedValue({
            id: 42,
            assignees: [],
            house: { members: [{ id: 1 }] }
        });
        (prisma.sharedTask.update as any).mockRejectedValue(new Error("La tâche a été supprimée entre-temps"));

        const result = await actions.edit({ request, locals } as any);
        expect(result).toEqual({
            status: 404,
            data: { SharedTaskError: "Ressource non trouvée" }
        });
    });
});

describe("household_chores - load", () => {
    it("redirects to /auth/welcome if the user is not logged in", async () => {
        await expect(
            load({ locals: { user: null } } as any)
        ).rejects.toMatchObject({
            status: 303,
            location: "/auth/welcome"
        });
    });
    it("returns the household's tasks, members and info correctly", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        const fakeHouse = {
            code: "LUMOS-42",
            houseName: "Poudlard",
            sharedTasks: [
                {
                    id: 1,
                    nameTask: "Sortir les poubelles",
                    assignees: [{ id: 1, username: "Harry" }]
                }
            ],
            members: [{ id: 1, username: "Harry" }]
        };
        (prisma.house.findFirst as any).mockResolvedValue(fakeHouse);
        (prisma.sharedTask.update as any).mockResolvedValue(undefined);
        const result = await load({ locals } as any);
        expect(prisma.house.findFirst).toHaveBeenCalledWith({
            where: {
                OR: [
                    { creatorId: 1 },
                    { members: { some: { id: 1 } } }
                ]
            },
            include: {
                sharedTasks: { include: { assignees: { select: { id: true, username: true } } } },
                members: { select: { id: true, username: true } }
            }
        });
        expect(result).toEqual({
            sharedTasks: fakeHouse.sharedTasks,
            houseCode: "LUMOS-42",
            members: fakeHouse.members,
            houseName: "Poudlard",
            current_user: {
                id: 1,
                role: Role.STUDENT
            },
            seo: {
                title: 'Tâches ménagères — Rappeltout'
            }
        });
    });
    it("returns default values if the user doesn't have a household", async () => {
        const locals = {
            user: {
                id: 1,
                role: Role.STUDENT
            }
        };
        (prisma.house.findFirst as any).mockResolvedValue(null);

        const result = await load({ locals } as any);
        expect(result).toEqual({
            sharedTasks: [],
            houseCode: undefined,
            members: [],
            houseName: undefined,
            current_user: {
                id: 1,
                role: Role.STUDENT
            },
            seo: {
                title: 'Tâches ménagères — Rappeltout'
            }
        });
    });
    it("notifies every assignee when a shared task is overdue", async () => {
        const locals = {
            user: { id: 1, role: Role.HEADMASTER }
        };

        const overdueTask = {
            id: 42,
            nameTask: "Sortir les poubelles",
            isFinish: false,
            endedAt: new Date("2026-01-01"),
            overdueNotifiedAt: null,
            assignees: [{ id: 1 }, { id: 2 }]
        };

        (prisma.house.findFirst as any).mockResolvedValue({
            code: "LUMOS-42",
            houseName: "Poudlard",
            sharedTasks: [overdueTask],
            members: [{ id: 1 }, { id: 2 }]
        });

        await load({ locals } as any);

        // Notifies every member assigned to the overdue task.
        expect(prisma.notification.create).toHaveBeenCalledTimes(2);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 1,
                type: 'TASK',
                title: 'Tâche en retard',
                message: 'La tâche "Sortir les poubelles" est en retard.',
                href: '/household_chores'
            }
        });

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 2,
                type: 'TASK',
                title: 'Tâche en retard',
                message: 'La tâche "Sortir les poubelles" est en retard.',
                href: '/household_chores'
            }
        });

        // Marks the task to avoid duplicate notifications.
        expect(prisma.sharedTask.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                overdueNotifiedAt: expect.any(Date)
            }
        });
    });
});

import { redirect, fail } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { userHouseWhere } from '$lib/server/house'
import { Category, Difficulty, Role } from '@prisma/client'
import { dealDmgForTask, undoDmgTask, activateOrSpawnNextMonster } from '$lib/server/monster'
import { getIO } from "$lib/server/socketInstance";
import { updateStatsOnTaskCompleted, undoStatsOnTaskCompleted } from '$lib/server/profile'
import { create_notification } from '$lib/server/notification';
import { HomeUpdate } from '$lib/server/homeWebSockets';
import { Action, can, canEditSharedTask, canValidateSharedTask } from '$lib/server/permissions';

export const actions = {
    create: async ({ request, locals }) => {

        if (!locals.user)
            throw redirect(303, '/auth/welcome');
        if (!can(locals.user.role, Action.CREATE_TASK))
            return fail(403, { SharedTaskError: "Action non autorisée" });
        //Retrieving form data
        const formData = await request.formData();
        const task = formData.get("task")?.toString().trim() ?? '';
        const date = formData.get("date");
        const category = formData.get("category");
        const difficulty = formData.get("difficulty");
        const memberIds = formData.getAll("assignee").map(m => Number(m));
        const endedAt = date ? new Date(date as string) : null;

        //Checking that the data is not null before using it
        if (!task || !category || !difficulty)
            return fail(400, { error: "Champs obligatoires manquants" });

        if (task.length > 500)
            return fail(400, { error: "La tâche ne doit pas dépasser 500 caractères" });

        //Checking that the values do match the expected Prisma enums
        if (!Object.values(Category).includes(category as Category)
            || !Object.values(Difficulty).includes(difficulty as Difficulty))
            return fail(400, { error: "Catégorie ou difficulté invalide" });

        if (endedAt) {
            if (isNaN(endedAt.getTime()))
                return fail(400, { error: "Date limite invalide" });

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            if (endedAt < today)
                return fail(400, { error: "La date limite ne peut être antérieure à aujourd'hui" });
        }

        const house = await prisma.house.findFirst({
            where: userHouseWhere(locals.user.id),
            include: {
                members: { select: { id: true } }
            }
        });
        if (!house)
            return fail(404, { SharedTaskError: "Ressource non trouvée" });

        // Checks that the members have valid ids
        const validMemberIds = memberIds.filter(id => house.members.some(m => m.id === id));
        if (validMemberIds.length !== memberIds.length)
            return fail(400, { error: "Assigné(s) invalides(s)" });

        //Store in the database
        await prisma.sharedTask.create({
            data: {
                houseCode: house?.code,
                nameTask: task,
                endedAt: endedAt,
                category: category as Category,
                difficulty: difficulty as Difficulty,
                assignees: { connect: memberIds.map((id) => ({ id })) },
            }
        });

        const io = getIO();
        if (io)
            HomeUpdate(io, house?.code);
    },

    check: async ({ request, locals }) => {
        // If the user is not logged in, redirect them to the login page
        if (!locals.user)
            throw redirect(303, '/auth/welcome');
        const data = await request.formData();
        const id = Number(data.get('id'));
        if (!Number.isInteger(id) || id <= 0)
            return fail(400, { SharedTaskError: "Identifiant de tâche invalide" });

        //We re-read the actual state from the database rather than trusting isFinish sent by the client (avoids a desync if several tabs/requests are open)
        //No filter by userId: all household members can check a shared task, but we verify that the task does belong to the user's household
        const task = await prisma.sharedTask.findFirst({
            where: { id, house: { members: { some: { id: locals.user.id } } } },
            include: { assignees: true }
        });
        if (!task)
            return fail(404, { SharedTaskError: "Ressource non trouvée" });
        const user_id = locals.user.id;
        const is_assigned = task.assignees.some(
            (assignee) => assignee.id === user_id
        );
        const has_assignees = task.assignees.length > 0;

        if (!canValidateSharedTask(
            locals.user.role,
            is_assigned,
            has_assignees
        ))
            return fail(403, { SharedTaskError: "Action non autorisée" });

        //Validates or invalidates the task
        const willBeFinished = !task.isFinish;
        try {
            await prisma.sharedTask.update({
                where: { id },
                data: {
                    isFinish: !task.isFinish,
                    finishedAt: !task.isFinish ? new Date() : null
                }
            });
            // Call to the function that will generate/delete combatLogs
            //Updates stats of the player
            if (willBeFinished) {
                await dealDmgForTask(task, locals.user.id, getIO() ?? undefined);
                await updateStatsOnTaskCompleted(task, locals.user.id);
            }
            else {
                await undoDmgTask(task.id, getIO() ?? undefined);
                await undoStatsOnTaskCompleted(task.id);
            }
            const house = await prisma.house.findFirst({
                where: userHouseWhere(locals.user.id),
                include: {
                    members: { select: { id: true } }
                }
            });
            if (!house)
                return fail(404, { SharedTaskError: "Foyer non trouvé" });
            const io = getIO();
            if (io)
                HomeUpdate(io, house?.code);
        } catch {
            return fail(404, { SharedTaskError: "Ressource non trouvée" });
        }
    },

    delete: async ({ request, locals }) => {
        // If the user is not logged in, redirect them to the login page
        if (!locals.user)
            throw redirect(303, '/auth/welcome');
        if (!can(locals.user.role, Action.DELETE_TASK))
            return fail(403, { SharedTaskError: "Action non autorisée" });
        const data = await request.formData();
        const id = Number(data.get('id'));
        if (!Number.isInteger(id) || id <= 0)
            return fail(400, { SharedTaskError: "Identifiant de tâche invalide" });

        //Deletes the task from the database
        //No filter by userId: all household members can delete a shared task, but we verify that the task does belong to the user's household
        const result = await prisma.sharedTask.deleteMany({
            where: {
                id,
                house: { members: { some: { id: locals.user.id } } }
            }
        });
        if (result.count === 0)
            return fail(404, { SharedTaskError: "Ressource non trouvée" });
        const house = await prisma.house.findFirst({
            where: userHouseWhere(locals.user.id),
            include: {
                members: { select: { id: true } }
            }
        });
        if (!house)
            return fail(404, { SharedTaskError: "Foyer non trouvé" });
        const io = getIO();
        if (io)
            HomeUpdate(io, house?.code);
    },

    deleteChecked: async ({ locals }) => {
        // If the user is not logged in, redirect them to the login page
        if (!locals.user)
            throw redirect(303, '/auth/welcome');
        if (!can(locals.user.role, Action.DELETE_TASK))
            return fail(403, { SharedTaskError: "Action non autorisée" });

        //Deletes all checked tasks from the user's household (no filter by userId, all members can delete, but only within their own household)
        await prisma.sharedTask.deleteMany({
            where: {
                isFinish: true,
                house: { members: { some: { id: locals.user.id } } }
            }
        });
        const house = await prisma.house.findFirst({
            where: userHouseWhere(locals.user.id),
            include: {
                members: { select: { id: true } }
            }
        });
        if (!house)
            return fail(404, { SharedTaskError: "Foyer non trouvé" });
        const io = getIO();
        if (io)
            HomeUpdate(io, house?.code);
    },

    edit: async ({ locals, request }) => {
        if (!locals.user)
            throw redirect(303, '/auth/welcome');

        //Retrieving form data
        const formData = await request.formData();
        const taskName = formData.get("task")?.toString().trim() ?? '';
        const date = formData.get("date");
        const category = formData.get("category");
        const difficulty = formData.get("difficulty");
        const memberIds = formData.getAll("assignee").map(m => Number(m));
        const endedAt = date ? new Date(date as string) : null;

        //Checking that the data is not null before using it
        if (!taskName || !category || !difficulty)
            return fail(400, { error: "Champs obligatoires manquants" });

        if (taskName.length > 500)
            return fail(400, { error: "La tâche ne doit pas dépasser 500 caractères" });

        //Checking that the values do match the expected Prisma enums
        if (!Object.values(Category).includes(category as Category)
            || !Object.values(Difficulty).includes(difficulty as Difficulty))
            return fail(400, { error: "Catégorie ou difficulté invalide" });

        if (endedAt) {
            if (isNaN(endedAt.getTime()))
                return fail(400, { error: "Date limite invalide" });

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            if (endedAt < today)
                return fail(400, { error: "La date limite ne peut être antérieure à aujourd'hui" });
        }

        const id = Number(formData.get('id'));
        if (!Number.isInteger(id) || id <= 0)
            return fail(400, { SharedTaskError: "Identifiant de tâche invalide" });

        //No filter by userId: all household members can edit a shared task, but we verify that the task does belong to the user's household
        const existingTask = await prisma.sharedTask.findFirst({
            where: { id, house: { members: { some: { id: locals.user.id } } } },
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
        if (!existingTask)
            return fail(404, { SharedTaskError: "Ressource non trouvée" });
        const user_id = locals.user.id;
        const is_assigned = existingTask.assignees.some(
            (assignee) => assignee.id === user_id
        );
        const has_assignees = existingTask.assignees.length > 0;

        if (!canEditSharedTask(
            locals.user.role,
            is_assigned,
            has_assignees
        ))
            return fail(403, { SharedTaskError: "Action non autorisée" });

        // Checks that the members have valid ids
        const validMemberIds = memberIds.filter(id => existingTask.house.members.some(m => m.id === id));
        if (validMemberIds.length !== memberIds.length)
            return fail(400, { error: "Assigné(s) invalides(s)" });

        try {
            await prisma.sharedTask.update({
                where: {
                    id
                },
                data: {
                    nameTask: taskName,
                    endedAt: endedAt,
                    category: category as Category,
                    difficulty: difficulty as Difficulty,
                    assignees: { set: memberIds.map((id) => ({ id })) },
                    overdueNotifiedAt: null,
                }
            });
            const house = await prisma.house.findFirst({
                where: userHouseWhere(locals.user.id),
                include: {
                    members: { select: { id: true } }
                }
            });
            if (!house)
                return fail(404, { SharedTaskError: "Foyer non trouvé" });
            const io = getIO();
            if (io)
                HomeUpdate(io, house?.code);
        } catch {
            return fail(404, { SharedTaskError: "Ressource non trouvée" });
        }
    }
}

// Retrieves the data and returns it to the frontend
export const load = async ({ locals }) => {
    if (!locals.user)
        throw redirect(303, '/auth/welcome');

    const house = await prisma.house.findFirst({
        where: userHouseWhere(locals.user.id),
        include: {
            sharedTasks: {
                include: {
                    assignees: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            members: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    if (!house) {
        return {
            sharedTasks: [],
            houseCode: undefined,
            members: [],
            houseName: undefined,
            current_user: {
                id: locals.user.id,
                role: locals.user.role
            },
            seo: {
                title: 'Tâches ménagères — Rappeltout'
            }
        };
    }

    // Start of the current day.
    // A task due today is therefore not yet considered overdue.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Finds overdue shared tasks that have not yet
    // generated a notification.
    const overdueTasks = house.sharedTasks.filter((task) =>
        !task.isFinish &&
        task.endedAt !== null &&
        task.endedAt < today &&
        task.overdueNotifiedAt === null
    );

    for (const task of overdueTasks) {

        // The notification is sent to each member assigned to the task.
        for (const assignee of task.assignees) {
            await create_notification(
                assignee.id,
                'TASK',
                'Tâche en retard',
                `La tâche "${task.nameTask}" est en retard.`,
                '/household_chores'
            );
        }

        // The task is marked only if there was at least one recipient.
        // This avoids considering an unassigned task as "notified".
        if (task.assignees.length > 0) {
            await prisma.sharedTask.update({
                where: {
                    id: task.id
                },
                data: {
                    overdueNotifiedAt: new Date()
                }
            });
        }
    }

    let activeMonster = await prisma.monster.findFirst({
        where: { houseId: house.code, status: 'ACTIVE' },
        select: {
            maxHp: true,
            currentHp: true,
            template: { select: { name: true } }
        }
    });
    if (!activeMonster)
        activateOrSpawnNextMonster(house.code);

    return {
        sharedTasks: house.sharedTasks,
        houseCode: house.code,
        members: house.members,
        houseName: house.houseName,
        current_user: {
            id: locals.user.id,
            role: locals.user.role
        },
        seo: {
            title: 'Tâches ménagères — Rappeltout'
        },
        activeMonster
    };
};

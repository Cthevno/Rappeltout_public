/**
 * @file monster.ts
 * @brief A set of functions involved in the management of monsters, combat actions, and health calculations.
 * @details Handles 3 main functions:
 *          - activateOrSpawnNextMonster: retrieves or spawns the next monster for a house.
 *          - dealDmgForTask: records combat logs, updates user damage dealt, and applies damage to the active monster when a task is completed.
 *          - undoDmgTask: erases combat logs linked to an unvalidated task, restoring monster health and user statistics.
 */

import { MonsterStatus, Difficulty, MonsterDifficulty } from '@prisma/client';
import type { SharedTask, User } from '@prisma/client';
import type { Server } from 'socket.io';
import { prisma } from '$lib/server/prisma'
import { notifyMonsterUpdated } from '$lib/server/monsterWebSockets';
import { notifyProfileUpdated } from '$lib/server/profileWebSockets';
import { create_notification } from '$lib/server/notification';

/**
 * Mapping table defining the maximum health points (HP) for each monster difficulty level.
 */
const MAPPING_MAX_HEALTH: Record<MonsterDifficulty, number> = {
    EASY: 50,
    MEDIUM: 100,
    HARD: 150,
    VERYHARD: 200,
}

/**
 * Mapping table defining the damage dealt by a task based on its difficulty level.
 */
const MAPPING_DEGATS: Record<Difficulty, number> = {
    SUPER_EASY: 5,
    EASY: 10,
    MEDIUM: 15,
    DIFFICULT: 20,
};

/**
 * @brief Returns the damage value associated with a given task difficulty.
 * @param difficulty (Difficulty) The difficulty level of the task.
 * @return A number corresponding to the damage amount.
 */
export function taskDifficultyToDmg(difficulty: Difficulty): number {
    return MAPPING_DEGATS[difficulty];
}

/**
 * @brief Returns the maximum health points associated with a given monster difficulty.
 * @param difficulty (MonsterDifficulty) The difficulty level of the monster.
 * @return A number corresponding to the maximum HP amount.
 */
export function monsterDifficultyToHealth(difficulty: MonsterDifficulty): number {
    return MAPPING_MAX_HEALTH[difficulty];
}

/**
 * @brief Activates the next queued monster or spawns a random new one for a specific house.
 * @details Checks for an existing monster with 'NEXT' status in the house and activates it. 
 *          If none exists, selects a random monster template and difficulty to create a new active monster.
 * @param houseCode (string) The unique code identifier of the house.
 * @return The activated or newly created monster object, or null if no templates exist.
 */
export async function activateOrSpawnNextMonster(houseCode: string) {
    let nextMonster = await prisma.monster.findFirst({
        where: { houseId: houseCode, status: 'NEXT' }
    });

    if (nextMonster) {
        return await prisma.monster.update({
            where: { id: nextMonster.id },
            data: { status: 'ACTIVE' },
            include: {
                template: true,
                combatLogs: { orderBy: { createdAt: 'asc' }, include: { user: true } },
                monsterLoots: true
            }
        });
    }

    const templates = await prisma.monsterTemplate.findMany();
    if (templates.length === 0) return null;

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const difficulties = Object.values(MonsterDifficulty);
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    // const selectedDifficulty = 'MEDIUM';
    const hp = monsterDifficultyToHealth(randomDifficulty);

    return await prisma.monster.create({
        data: {
            templateId: randomTemplate.id,
            houseId: houseCode,
            difficulty: randomDifficulty,
            maxHp: hp,
            currentHp: hp,
            status: 'ACTIVE',
            killed: false
        },
        include: {
            template: true,
            combatLogs: { orderBy: { createdAt: 'asc' }, include: { user: true } },
            monsterLoots: true
        }
    });
}

/**
 * Type definition for a shared task extended with its assigned users.
 */
type TaskWithAssignees = SharedTask & { assignees: User[] };

/**
 * @brief Deals damage to the active monster and records combat logs when a task is completed.
 * @details Calculates damage based on task difficulty, determines who deals the damage (assignees or the validating user),
 *          creates combat logs, updates user damage stats, reduces monster health, and handles monster defeat/respawn logic.
 * @param task (TaskWithAssignees) The completed task object containing difficulty, house code, and assignees.
 * @param userId (number) The ID of the user who validated the task if no assignees are specified.
 * @param [io] (Server) Optional Socket.IO server instance to broadcast real-time updates.
 */
export async function dealDmgForTask(task: TaskWithAssignees, userId: number, io?: Server) {
    let activeMonster = await prisma.monster.findFirst({
        where: { houseId: task.houseCode, status: MonsterStatus.ACTIVE },
        include: {
            template: true,
            monsterLoots: true
        }
    });
    if (!activeMonster)
        return;

    const damage = taskDifficultyToDmg(task.difficulty);

    const validatorIds = task.assignees.length > 0
        ? task.assignees.map((a) => a.id)
        : [userId];

    const validators = await prisma.user.findMany({
        where: { id: { in: validatorIds } }
    });
    const usersById = new Map(validators.map((u) => [u.id, u]));

    let currentHp = activeMonster.currentHp;
    let isDead = false;

    for (const validatorId of validatorIds) {
        try{
            await prisma.combatLog.create({
                data: {
                    monsterId: activeMonster.id,
                    userId: validatorId,
                    authorName: usersById.get(validatorId)?.username ?? "Inconnu",
                    houseId: task.houseCode,
                    sharedTaskId: task.id,
                    dmg: damage,
                }
            });
    
            // Update each profile
            await prisma.user.update({
                where: { id: validatorId },
                data: { totalDmgDealt: { increment: damage } }
            });
        } catch (err) {
            console.error(`Validator ${validatorId} could not be processed (possibly deleted)`, err);
            continue;
        }

        // If the monster is not dead yet, deals damage to it
        if (!isDead) {
            currentHp = Math.max(0, currentHp - damage);
            if (currentHp === 0)
                isDead = true;
        }
    }

    await prisma.monster.update({
        where: { id: activeMonster.id },
        data: {
            currentHp,
            status: isDead ? MonsterStatus.FINISHED : MonsterStatus.ACTIVE,
            killed: isDead,
            finishedDate: isDead ? new Date() : null
        }
    });

    if (isDead) {
        const house = await prisma.house.findUnique({
            where: { code: task.houseCode },
            select: { members: { select: { id: true } } }
        });
        if (house) {
            await prisma.user.updateMany({
                where: { id: { in: house.members.map((m) => m.id) } },
                data: { monstersSlayed: { increment: 1 } }
            });

            if (activeMonster.lootType === 'COLLECTIVE') {
                const loot = activeMonster.collectiveLoot?.trim()
                    || 'Aucun butin collectif n’a été défini.';
            
                await Promise.all(
                    house.members.map((member) =>
                        create_notification(
                            member.id,
                            'MONSTER',
                            'Monstre vaincu !',
                            `${activeMonster.template.name} a été vaincu. Butin collectif : ${loot}`,
                            '/notifications'
                        )
                    )
                );
            } else {
                const individualLootsByUser = new Map(
                    activeMonster.monsterLoots.map((loot) => [
                        loot.userId,
                        loot.content
                    ])
                );
            
                await Promise.all(
                    activeMonster.monsterLoots.map((loot) => {
                        const member = house.members.find(
                            (houseMember) => houseMember.id === loot.userId
                        );
                    
                        if (!member) return Promise.resolve();
                    
                        return create_notification(
                            member.id,
                            'MONSTER',
                            'Monstre vaincu !',
                            `${activeMonster.template.name} a été vaincu. Ton butin : ${loot.content}`,
                            '/notifications'
                        );
                    })
                );
            }
        }
        await activateOrSpawnNextMonster(task.houseCode);
    }

    if (io) {
        notifyMonsterUpdated(io, task.houseCode);
        notifyProfileUpdated(io, task.houseCode);
    }
}

/**
 * @brief Reverses damage and deletes combat logs when a task is uncompleted.
 * @details Warning: Designed with the safeguard that monsters will never be resurrected if they were already killed.
 *          Restores monster health if still alive, decrements total damage dealt for the involved users, and removes combat logs.
 * @param taskId (number) The unique identifier of the unvalidated task.
 * @param [io] (Server) Optional Socket.IO server instance to broadcast real-time updates.
 */
// Warning this function is done while thinking of the problem that it could generate, so monsters will never be resurected
export async function undoDmgTask(taskId: number, io?: Server) {
    try {
        const combatLogs = await prisma.combatLog.findMany({
            where: { sharedTaskId: taskId }
        });

        if (combatLogs.length === 0) return;

        const monster = await prisma.monster.findUnique({
            where: { id: combatLogs[0].monsterId }
        });

        if (monster && !monster.killed) {
            // Monster is still alive ? we restore health
            const totalDamage = combatLogs.reduce((sum, log) => sum + log.dmg, 0);
            const newHp = Math.min(monster.maxHp, monster.currentHp + totalDamage);
            await prisma.monster.update({
                where: { id: monster.id },
                data: { currentHp: newHp }
            });
        }

        for (const log of combatLogs) {
            if (log.userId) {
                await prisma.user.update({
                    where: { id: log.userId },
                    data: { totalDmgDealt: { decrement: log.dmg } }
                });
            }
        }

        await prisma.combatLog.deleteMany({
            where: { sharedTaskId: taskId }
        });

        const houseId = combatLogs[0].houseId;
        if (io && houseId) {
            notifyMonsterUpdated(io, houseId);
            notifyProfileUpdated(io, houseId);
        }
    } catch (error) {
        console.error("Failed to undo task damage:", error);
        throw error;
    }
}
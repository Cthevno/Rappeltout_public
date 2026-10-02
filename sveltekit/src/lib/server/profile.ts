/**
 * @file profile.ts
 * @brief Functions used to update profile statistics (XP and tasks completed) when a task is completed or uncompleted.
 * @details A new model, TaskCompletion, was created to log task completions for each assignee, 
 *          saving which user benefits from a validated task (or the user who checked the task if there were none). 
 *          This allows updating those players and invalidating their rewards if the task is subsequently invalidated.
 */

import { Difficulty } from "@prisma/client";
import { prisma } from '$lib/server/prisma';
import type { SharedTask, User } from '@prisma/client';
import { create_notification } from '$lib/server/notification';

/**
 * Mapping table defining the amount of experience points (XP) awarded for each task difficulty level.
 */
const MAPPING_XP: Record<Difficulty, number> = {
    SUPER_EASY: 5,
    EASY: 10,
    MEDIUM: 15,
    DIFFICULT: 20,
}

/**
 * @brief Returns the XP value associated with a given task difficulty.
 * @param difficulty (Difficulty) The difficulty level of the task.
 * @return A number corresponding to the amount of XP.
 */
export function getXpForDifficulty(difficulty: Difficulty): number {
    return MAPPING_XP[difficulty];
}

/**
 * Type definition for a shared task extended with its assigned users.
 */
type TaskWithAssignees = SharedTask & { assignees: User[] };

/**
 * @brief Updates user statistics, logs completions, and sends a level-up notification when needed.
 * @details Increments the completed task count and total XP for all assignees (or the validating user if no assignees exist),
 *          stores the reward in TaskCompletion, and creates an XP notification when the awarded XP pushes a user to the next level.
 * @param task (TaskWithAssignees) The task object containing its difficulty, ID, and assignees.
 * @param userId (number) The ID of the user who performed the validation action if no assignees are present.
 */

export async function updateStatsOnTaskCompleted(task: TaskWithAssignees, userId: number) {
    const xp = getXpForDifficulty(task.difficulty);

    // Determine who receives the rewards: assignees if present, otherwise the user who checked the task.
    const taskValidatorIds = task.assignees.length > 0
        ? task.assignees.map((a) => a.id)
        : [userId];

    for (const taskValidatorId of taskValidatorIds) {
        const currentUser = task.assignees.find((assignee) => assignee.id === taskValidatorId)
            ?? await prisma.user.findUnique({
                where: { id: taskValidatorId },
                select: { totalXP: true, username: true },
            });

        if (!currentUser) 
            continue;

        const currentLevel = Math.floor(currentUser.totalXP / 500) + 1;
        const newTotalXP = currentUser.totalXP + xp;
        const newLevel = Math.floor(newTotalXP / 500) + 1;

        // Update user profile stats (tasks count and total XP)
        await prisma.user.update({
            where: { id: taskValidatorId },
            data: {
                sharedTasksCompleted: { increment: 1 },
                totalXP: { increment: xp }
            }
        });

        if (currentLevel < newLevel) {
            await create_notification(
                taskValidatorId,
                'XP',
                'Niveau supérieur !',
                `Bravo ${currentUser.username} ! Tu passes au niveau ${newLevel}.`,
                '/profile'
            );
        }
        
        // Log the completion in TaskCompletion to track individual rewards 
        // and allow reverting them if the task validation is canceled later.
        await prisma.taskCompletion.create({
            data: {
                sharedTaskId: task.id,
                userId: taskValidatorId,
                xpAwarded: xp
            }
        });
    }
}

/**
 * @brief Reverses user statistics updates and removes completion logs when a task is uncompleted.
 * @details Decrements the completed task count and total XP for each user based on their recorded task completion logs, then deletes the logs.
 * @param taskId (number) The unique identifier of the task being reverted.
 */
export async function undoStatsOnTaskCompleted(taskId: number){
    // Retrieve all TaskCompletion logs associated with this task to know precisely 
    // which users received rewards and how much XP was awarded.
    const completions = await prisma.taskCompletion.findMany({
        where: { sharedTaskId: taskId }
    });

    for (const completion of completions) {
        // Revert user profile stats using the logged data
        await prisma.user.update({
            where: { id: completion.userId },
            data: {
                sharedTasksCompleted: { decrement: 1 },
                totalXP: { decrement: completion.xpAwarded }
            }
        });
    }
    
    // Clean up the task completion history logs
    await prisma.taskCompletion.deleteMany({
        where: { sharedTaskId: taskId },
    });
}
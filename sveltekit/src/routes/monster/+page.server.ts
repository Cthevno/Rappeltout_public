/**
 * @file +page.server.ts
 * @brief Monster backend
 * @details A load that returns all data needed by the diffrent components of the monster page
 * Some functions that will modifye the DB when users will trigger them (update the loot)
 * The damage functions are on the household_chores page.server.ts file because it's triggerd after a task is completed
 */

import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { userHouseWhere } from '$lib/server/house';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { activateOrSpawnNextMonster } from '$lib/server/monster';
import { getIO } from "$lib/server/socketInstance";
import { notifyMonsterUpdated } from '$lib/server/monsterWebSockets';
import { Action, can, canEditIndividualLoot } from '$lib/server/permissions';


export const load: PageServerLoad = async ({ locals }) => {
    try {
        if (!locals.user) throw redirect(303, '/auth/welcome');

        const house = await prisma.house.findFirst({
            where: userHouseWhere(locals.user.id),
            include: {
                members: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        if (!house)
            throw redirect(303, '/house/create');

        // Seaching for an ACTIVE monster
        let activeMonster = await prisma.monster.findFirst({
            where: { houseId: house.code, status: 'ACTIVE' },
            include: {
                template: true,
                combatLogs: { orderBy: { createdAt: 'asc' }, include: { user: true } },
                monsterLoots: true
            }
        });

        // Did my monster escaped ? If the answer is yes, update activeMonster and set it to Null, to take the next monster
        if (activeMonster && activeMonster.escapeDate && new Date() > activeMonster.escapeDate) {
            await prisma.monster.update({
                where: { id: activeMonster.id },
                data: {
                    status: 'FINISHED'
                }
            });
            activeMonster = null;
        }
        // No active monster ?
        if (!activeMonster)
            activeMonster = await activateOrSpawnNextMonster(house.code);

        // Calcul of damage for each player to build the object given to DamageList component
        const scoresMap: Record<number, { id: number, login: string; score: number; avatar: string }> = {};
        // We set the score of each member to make sure every user will be printed
        for (const member of house.members) {
            scoresMap[member.id] = {
                id: member.id,
                login: member.username,
                score: 0,
                avatar: member.avatar
            };
        }
        // We update the total score of each member
        if (activeMonster?.combatLogs) {
            for (const log of activeMonster.combatLogs) {
                if (log.userId && scoresMap[log.userId]) {
                    scoresMap[log.userId].score += log.dmg;
                }
            }
        }
        const playersWithScores = Object.values(scoresMap);

        return {
            activeMonster,
            houseCode: house.code,
            houseName: house.houseName,
            players: playersWithScores,
            current_user: {
                id: locals.user.id,
                role: locals.user.role
            }
        };
    } catch (err) {
        console.error("Critical error while loading monster", err);
        throw err;
    }
};

const MAX_LOOT_LENGTH = 60;

export const actions: Actions = {

    updateLootType: async ({ request, locals }) => {
        if (!locals.user) throw redirect(303, '/auth/welcome');

        const formData = await request.formData();
        const monsterId = Number(formData.get('monsterId'));
        const lootType = formData.get('lootType') as string;

        if (!monsterId || !lootType) {
            return fail(400, { error: "Données manquantes" });
        }

        if (!can(locals.user.role, Action.MANAGE_LOOT)) {
            return fail(403, { error: "Votre statut dans le foyer ne vous permet pas de modifier le type de butin" });
        }

        //  We make sure the monster exists and belongs to the user's household
        const monster = await prisma.monster.findFirst({
            where: { id: monsterId, household: { members: { some: { id: locals.user.id } } } }
        });
        if (!monster) {
            return fail(404, { error: "Monster doesn't exist" });
        }

        try {
            await prisma.monster.update({
                where: { id: monsterId },
                data: { lootType: lootType as any }
            });
            const io = getIO();
            if (io) {
                notifyMonsterUpdated(io, monster.houseId);
            }
            return { success: true };
        } catch (err) {
            console.error("Error while updating loot type.", err);
            return fail(500, { error: "Erreur serveur" });
        }
    },
    updateCollectiveLoot: async ({ request, locals }) => {
        if (!locals.user) throw redirect(303, '/auth/welcome');

        const formData = await request.formData();
        const monsterId = Number(formData.get('monsterId'));
        const rawCollectiveLoot = formData.get('collectiveLoot') as string;

        if (!monsterId)
            return fail(400, { error: "ID manquant" });
        if (typeof rawCollectiveLoot !== 'string')
            return fail(400, { error: "Champ collectiveloot manquant." });

        const collectiveLoot = rawCollectiveLoot;
        // Check if the loot has been changed to something larger than MAX_LOOT_LENGTH
        if (collectiveLoot.length > MAX_LOOT_LENGTH) {
            return fail(400, { error: `Loot can't be larger than ${MAX_LOOT_LENGTH} characters` })
        }
        if (!can(locals.user.role, Action.MANAGE_LOOT)) {
            return fail(403, { error: "Votre statut dans le foyer ne vous permet pas de modifier le butin collectif" });
        }
        const monster = await prisma.monster.findFirst({
            where: { id: monsterId, household: { members: { some: { id: locals.user.id } } } }
        });
        if (!monster)
            return fail(404, { error: "Monster doesn't exist" });
        try {
            await prisma.monster.update({
                where: { id: monsterId },
                data: { collectiveLoot }
            });
            const io = getIO();
            if (io) {
                notifyMonsterUpdated(io, monster.houseId);
            }
            return { success: true };
        } catch (err) {
            console.error("Error while updating collective loots", err);
            return fail(500, { error: "Erreur serveur" });
        }
    },
    updateIndividualLoots: async ({ request, locals }) => {
        if (!locals.user) throw redirect(303, '/auth/welcome');

        const formData = await request.formData();
        const monsterId = Number(formData.get('monsterId'));
        const lootsDataJson = formData.get('lootsData') as string;

        if (!monsterId || !lootsDataJson) {
            return fail(400, { error: "Données manquantes" });
        }

        let lootsData: Record<string, string>;
        try {
            const parsed = JSON.parse(lootsDataJson);
            if (
                typeof parsed !== 'object' ||
                parsed === null ||
                Array.isArray(parsed) ||
                !Object.values(parsed).every((v) => typeof v === 'string')
            ) {
                return fail(400, { error: "Format de données invalide" });
            }
            lootsData = parsed as Record<string, string>;
        } catch (err) {
            return fail(400, { error: "Format de données invalide" });
        }
        // Check if one of the loots has been change to something larger than MAX_LOOT_LENGTH
        for (const content of Object.values(lootsData)) {
            if (content.length > MAX_LOOT_LENGTH) {
                return fail(400, { error: `Un butin dépasse ${MAX_LOOT_LENGTH} caractères` });
            }
        }
        const monster = await prisma.monster.findFirst({
            where: { id: monsterId, household: { members: { some: { id: locals.user.id } } } }
        });
        if (!monster)
            return fail(404, { error: "monster doesn't exist" });

        try {
            for (const [userIdStr, content] of Object.entries(lootsData)) {
                const userId = Number(userIdStr);
                if (!userId) continue;
                // A student can only modify their own loot, guardians can modify everyone's
                if (!canEditIndividualLoot(locals.user.role, locals.user.id, userId)) continue;
                const existingLoot = await prisma.monsterLoot.findFirst({
                    where: { monsterId, userId }
                });
                if (content.trim() === "") {
                    if (existingLoot) {
                        await prisma.monsterLoot.delete({ where: { id: existingLoot.id } });
                    }
                } else {
                    if (existingLoot) {
                        await prisma.monsterLoot.update({
                            where: { id: existingLoot.id },
                            data: { content }
                        });
                    } else {
                        await prisma.monsterLoot.create({
                            data: { monsterId, userId, content }
                        });
                    }
                }
            }
            const io = getIO();
            if (io) {
                notifyMonsterUpdated(io, monster.houseId);
            }
            return { success: true };
        } catch (err) {
            console.error("Error while updating individual loots", err);
            return fail(500, { error: "Erreur serveur" });
        }
    }
};
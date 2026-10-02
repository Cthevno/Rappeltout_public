import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

/**
 * @brief Loads the data required by the home page.
 *
 * @details
 * Retrieves the notifications belonging to the currently
 * authenticated user, ordered from newest to oldest.
 *
 * @return Home page data containing the user information,
 * notifications, and SEO metadata.
 */
export async function load({ locals }) {
    const { user } = locals;

    if (!user) {
        throw redirect(303, '/auth/welcome');
    }

    const notifications = await prisma.notification.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    });

    const infos = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            housesJoined: {
                include: {
                    members: true,
                    pendingMembers: true,
                    sharedTasks: {
                        include: {
                            assignees: true
                        }
                    },
                    monsters:
                    {
                        where: { status: 'ACTIVE' },
                        include: { template: true },
                    }

                }
            }
        }
    });

    const profil = await prisma.user.findUnique({
        where: { id: user.id },
        select: { totalXP: true, avatar: true }
    });

    const houseCode = infos?.housesJoined[0]?.code ?? null;

    const monsterName = infos?.housesJoined[0]?.monsters?.[0]?.template.name ?? "Pas encore de monstre actif, cliquez ici";
    const currentPV = infos?.housesJoined[0]?.monsters?.[0]?.currentHp ?? 0;
    const maxPV = infos?.housesJoined[0]?.monsters?.[0]?.maxHp ?? 0;

    const members = infos?.housesJoined[0]?.members?.length ?? 0;
    const pendingMembers = infos?.housesJoined[0]?.pendingMembers?.length ?? 0;

    const totalTasks = infos?.housesJoined[0]?.sharedTasks?.length ?? 0;
    const todoTasks = infos?.housesJoined[0]?.sharedTasks?.filter((task) => !task.isFinish).length ?? 0;
    const finishTasks = infos?.housesJoined[0]?.sharedTasks?.filter((task) => task.isFinish).length ?? 0;
    const mineTasks = infos?.housesJoined[0]?.sharedTasks?.filter((task) => !task.isFinish && (task.assignees.some((a: any) => a.id === user.id) || task.assignees.length === 0)).length ?? 0;

    const totalXP = profil?.totalXP ?? 0;
    const currentAvatar = profil?.avatar ?? null;

    return {
        user: { username: user.username },
        houseData: {
            houseCode: houseCode,
            monsterName: monsterName,
            currentPV: currentPV,
            maxPV: maxPV,
            members: members,
            pendingMembers: pendingMembers,
            totalTasks: totalTasks,
            todoTasks: todoTasks,
            finishTasks: finishTasks,
            mineTasks: mineTasks,
            totalXP: totalXP,
            currentAvatar: currentAvatar
        },
        notifications,
        seo: {
            title: 'Accueil — Rappeltout'
        }
    };
}

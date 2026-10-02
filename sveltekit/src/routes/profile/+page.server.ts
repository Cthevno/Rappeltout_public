import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad, Actions } from './$types';
import { AVAILABLE_AVATARS } from '$lib/avatars';
import { fail } from '@sveltejs/kit';
import { getIO } from "$lib/server/socketInstance";
import { HomeUpdate } from '$lib/server/homeWebSockets';
import { userHouseWhere } from '$lib/server/house';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/auth/welcome');
    }

    
    const userInfos = await prisma.user.findUnique({
        where: { id: locals.user.id },
        select: {
            username: true,
            avatar: true,
            sharedTasksCompleted: true,
            totalDmgDealt: true,
            monstersSlayed: true,
            totalXP: true
        }
    });
    if (!userInfos) {
        throw redirect(303, '/auth/welcome');
    }
    const house = await prisma.house.findFirst({
        where: userHouseWhere(locals.user.id),
    });

    return {
        seo: {
            title: 'Mon profil | Rappeltout',
            description: 'Consulte ton profil, ton level, tes statistiques et modifie ton avatar sur Rappeltout.'
        },
        userInfos,
        houseCode: house?.code ?? null
    };
};

export const actions: Actions = {
    updateUserAvatar: async ({ request, locals }) => {
        if (!locals.user)
            throw redirect(303, '/auth/welcome');

        const formData = await request.formData();
        const rawAvatar = (formData.get('newAvatar'));
        if (typeof rawAvatar !== 'string') {
            return (fail(400, { error: "Missing or invalid data" }));
        }
        const isValidAvatar = AVAILABLE_AVATARS.some((a) => a.path === rawAvatar);
        if (!isValidAvatar) {
            return (fail(400, { error: "This avatar isn't available" }));
        }
        try {
            await prisma.user.update({
                where: { id: locals.user.id },
                data: { avatar: rawAvatar }
            });

            const house = await prisma.house.findFirst({
                where: { members: { some: { id: locals.user.id } } }
            });
            if (house) {
                const io = getIO();
                if(io)
                    HomeUpdate(io, house.code);
            }
            
            return { success: true, avatar: rawAvatar };
        } catch (err) {
            return (fail(500, { error: "Internal server error" }));
        }

    }
}
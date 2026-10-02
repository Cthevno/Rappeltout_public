import { redirect } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

// Retrieves the data from Prisma and returns it to the frontend
export const load = async ({ locals }) => {
    if (!locals.user)
        throw redirect(303, '/auth/welcome');

    // Retrieves the household of which the user is the creator or a member
    const house = await prisma.house.findFirst({
        where: {
            OR: [
                { creatorId: locals.user.id },
                { members: { some: { id: locals.user.id } } }
            ]
        }
    });

    // This page is only reached after creating/joining a household: it must necessarily exist
    if (!house)
        throw redirect(303, '/house');

    return { code: house.code, username: locals.user.username, houseName: house.houseName, seo: { title: "Nouveau foyer - Rappeltout" } };
}

import { redirect, fail } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { Prisma, Role } from "@prisma/client"
import { generateCode } from '$lib/generateCode.js'
import { create_notification } from '$lib/server/notification';
import { userHasHouse } from '$lib/server/house';
import type { PageServerLoad } from './$types';
import { getIO } from "$lib/server/socketInstance";
import { HomeUpdate } from '$lib/server/homeWebSockets';


export const actions = {
    create: async ({ request, locals }) => {

        if (!locals.user)
            throw redirect(303, '/auth/welcome');

        const hasHouse = await userHasHouse(locals.user.id);
        if (hasHouse)
            throw redirect(303, "/home");

        const formData = await request.formData();
        const household_name = formData.get("household_name");

        if (!household_name || typeof household_name !== 'string')
            return fail(400, { error: "Champs obligatoires manquants" });
        if (household_name.length > 60)
            return fail(400, { error: "Le nom du foyer ne peut pas dépasser 60 caractères" });

        // Generates a code and creates the household, retries if the code already exists
        let code: string;
        while (true) {
            code = generateCode();
            try {
                await prisma.$transaction([
                    prisma.house.create({
                        data: {
                            houseName: household_name,
                            creatorId: locals.user.id,
                            code: code,
                            members: {
                                connect: { id: locals.user.id }
                            }
                        }
                    }),
                    prisma.user.update({
                        where: { id: locals.user.id },
                        data: { role: Role.HEADMASTER }
                    })
                ]);
                break;
            } catch (error) {
                // P2002 = unique constraint violation
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    continue;
                }
                throw (error);
            }
        }
        throw redirect(303, '/new_house');
    },

    join: async ({ request, locals }) => {

        if (!locals.user)
            throw redirect(303, '/auth/welcome');

        const hasHouse = await userHasHouse(locals.user.id);
        if (hasHouse)
            throw redirect(303, "/home");

        const formData = await request.formData();
        const code = formData.get("code")?.toString().trim() ?? '';

        if (!code || typeof code !== 'string')
            return fail(400, { error: "Champs obligatoires manquants" });

        // Looks for whether the code matches an existing household
        const result = await prisma.house.findUnique({
            where: { code },
            include: {
                members: {
                    select: {
                        id: true,
                        role: true,
                    }
                }
            }
        });
        if (!result)
            return (fail(404, { error: "Ce code ne correspond à aucun foyer." }));

        // Checks whether the user is already on this household's waiting list
        const result1 = await prisma.house.findFirst({
            where: { code: code, pendingMembers: { some: { id: locals.user.id } } }
        });
        if (result1)
            return (fail(404, { error: "Vous êtes déjà dans la liste d'attente" }));

        // Checks whether the user is already a member of this household
        const result2 = await prisma.house.findFirst({
            where: { code: code, members: { some: { id: locals.user.id } } }
        });
        if (result2)
            return (fail(404, { error: "Vous êtes déjà membre de ce foyer." }));

        // Checks whether this email was invited to join this household (case-insensitive comparison)
        const invitation = await prisma.invitation.findUnique({
            where: { email_houseCode: { email: locals.user.email.toLowerCase(), houseCode: code } }
        });

        if (invitation) {
            // The member was invited: add them directly to the members and delete the invitation
            await prisma.house.update({
                where: { code },
                data: {
                    members: {
                        connect: { id: locals.user.id }
                    }
                }
            });
            await prisma.invitation.delete({ where: { id: invitation.id } });
            for (const member of result.members) {
                await create_notification(
                    member.id,
                    'INVITATION',
                    'Nouveau membre dans le foyer',
                    `${locals.user.username} a rejoint le foyer "${result.houseName}".`,
                    '/house'
                );
            }
            const io = getIO();
            if (io)
                HomeUpdate(io, code);
            throw redirect(303, '/home');
        }
        const io = getIO();
        if (io)
            HomeUpdate(io, code);
        // Adds the user to the household's waiting list
        await prisma.house.update({
            where: { code },
            data: {
                pendingMembers: {
                    connect: { id: locals.user.id }
                }
            }
        })
        const members_to_notify = result.members.filter(
            (member) =>
                member.role === Role.HEADMASTER ||
                member.role === Role.TEACHER
        );

        for (const member of members_to_notify) {
            await create_notification(
                member.id,
                'INVITATION',
                'Nouvelle demande pour rejoindre ton foyer',
                `${locals.user.username} souhaite rejoindre le foyer "${result.houseName}".`,
                '/manage_house'
            );
        }
        return { success: true };
    },

}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, 'auth/welcome');
    }

    const hasHouse = await userHasHouse(locals.user.id);
    if (hasHouse)
        throw redirect(303, "/home");

    const notifications = await prisma.notification.findMany({
        where: { userId: locals.user.id },
        orderBy: { createdAt: 'desc' }
    });

    return { hasHouse, notifications };
}

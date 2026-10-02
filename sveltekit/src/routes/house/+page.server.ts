/**
 * @file +page.server.ts
 *
 * @brief Server endpoints for the house ("foyer") page: member invitation action and page data loading.
 *
 * @details Exposes one form action and one load function.
 * - actions.inviteMember: authenticated action inviting an email address to
 *   the host's house. Validates the email (presence, format, length <= 100),
 *   rejects addresses already belonging to a house member, accepts addresses
 *   found on the pending list (promoting them to member, notifying the user
 *   through create_notification plus the home/notifications WebSocket
 *   channels), otherwise records a new invitation (if not already present)
 *   and emails the join instructions including the house code.
 * - load: authenticated loader returning the caller's house (as creator or
 *   member) with its code, name, creation date and member list
 *   (id, username, totalXP), consumed by the house overview page.
 *
 * @see FormInvitation.svelte
 */

import { redirect, fail } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { isEmailFormatValid } from '../auth/auth_validation.js';
import { sendInvitationMail, isEmailDomainValid, notifyFailure } from '$lib/server/sendInvitationMail';
import type { PageServerLoad, Actions } from './$types';
import { create_notification } from '$lib/server/notification';
import { emitNotificationUpdate } from '$lib/server/notificationsWebSockets';
import { HomeUpdate } from '$lib/server/homeWebSockets';
import { getIO } from "$lib/server/socketInstance";
import { Action, can } from "$lib/server/permissions";

/**
 * @brief Handles the "inviteMember" form action (posted to "?/inviteMember" by FormInvitation).
 *
 * @param request (Request) The incoming form request; expects an "email" field.
 * @param locals (App.Locals) Request locals filled by the auth hooks; must contain user, otherwise the caller is redirected.
 *
 *
 * @retval success The action returns { success: true }: the invited email was on the pending list and has been promoted to member (notification + WebSocket updates emitted).
 * @retval failure The action returns fail(400, { error }): validation failure — missing email, invalid format, email longer than 100 chars, or already used by a house member.
 *
 * Other outcomes: 303 redirect to /auth/welcome when unauthenticated; undefined when the host has no house or after the invitation email has been sent.
 */
export const actions: Actions = {
	inviteMember: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');
		if (!can(locals.user.role, Action.INVITE_MEMBER))
			return fail(403, { error: "Action non autorisée" });
		// Get the email address of the person to be invited
		const formData = await request.formData();
		const email: string = formData.get("email")?.toString().trim().toLowerCase() ?? "";
		if (!email)
			return fail(400, { error: "Champs obligatoires manquants" });

		// Check that the email is valid
		if (isEmailFormatValid(email) === false)
			return fail(400, { error: "Format de l'email non valide" });

		// Check that the email is not too long
		if (email.length > 100)
			return fail(400, { error: "Email trop long !" });

		// Validate the email domain BEFORE any database operations
		if (!(await isEmailDomainValid(email))) {
			await notifyFailure(locals.user.id, email, "Le nom de domaine n'existe pas.");
			return fail(400, { error: "Le nom de domaine de cet email n'existe pas." });
		}

		// Get the host's house
		const house = await prisma.house.findFirst({
			where: { members: { some: { id: locals.user.id } } }
		});

		if (!house)
			throw redirect(303, '/house/create');

		// Check that the email address does not belong to a member of the house
		const existingMember = await prisma.user.findFirst({
			where: {
				email,
				housesJoined: { some: { code: house.code } },
			},
		});
		if (existingMember)
			return fail(400, { error: "Cette adresse mail est déjà utilisée dans ce foyer" });

		// Check whether the email address belongs to someone on the waiting list,
		// if true accept it and return.
		const pendingMember = await prisma.user.findFirst({
			where: {
				email,
				housesPending: { some: { code: house.code } },
			},
		});
		if (pendingMember) {
			await prisma.house.update({
				where: { code: house.code },
				data: {
					pendingMembers: { disconnect: { id: pendingMember.id } },
					members: { connect: { id: pendingMember.id } }
				}
			});
			await create_notification(
				pendingMember.id,
				'INVITATION',
				'Demande acceptée',
				`Ta demande pour rejoindre le foyer "${house.houseName}" a été acceptée.`,
				'/home'
			);

			const io = getIO();
			if (io)
				HomeUpdate(io, house.code);

			emitNotificationUpdate(pendingMember.id);
			return { success: true };
		}
		const invitedUser = await prisma.user.findFirst({
			where: {
				email,
				housesJoined: {
					none: {}
				}
			}
		});

		// Check that the email is not on the invitation list
		if (!(await prisma.invitation.findFirst({
			where: { email: email }
		}))) {
			// Add the email address to the invitation list
			await prisma.invitation.create({
				data: {
					email: email,
					houseCode: house.code
				}
			});
		}
		if (invitedUser) {
			await create_notification(
				invitedUser.id,
				'INVITATION',
				`Invitation à rejoindre ${house.houseName}`,
				`${locals.user.username} t’invite à rejoindre son foyer. Code : ${house.code}`,
				'/house/join'
			);
		}
		// Send the invitation
		sendInvitationMail(email, house.code, locals.user.id);
	}
};

/**
 * @brief Loads the house data for the house overview page.
 *
 * @param locals (App.Locals) Request locals filled by the auth hooks; must contain user, otherwise the caller is redirected.
 *
 * @return (object) Page data consumed by house/+page.svelte: code (string | undefined), members ({ id, username, totalXP }[]), houseName (string | undefined), houseCreationDate (Date, from createdAt), seo ({ title }). 303 redirect to /auth/welcome when unauthenticated.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user)
		throw redirect(303, '/auth/welcome');

	const house = await prisma.house.findFirst({
		where: {
			OR: [
				{ creatorId: locals.user.id },
				{ members: { some: { id: locals.user.id } } }
			]
		},
		select: {
			code: true,
			houseName: true,
			createdAt: true,
			members: {
				select: {
					id: true,
					username: true,
					totalXP: true,
					avatar: true,
					role: true,
				}
			},
		},
	});

	if (!house)
		throw redirect(303, '/house/create');

	return {
		code: house.code,
		members: house.members ?? [],
		houseName: house.houseName,
		houseCreationDate: house.createdAt,
		current_user: {
			id: locals.user.id,
			role: locals.user.role
		},
		seo: {
			title: "Foyer - Rappeltout",
		},
	};
}

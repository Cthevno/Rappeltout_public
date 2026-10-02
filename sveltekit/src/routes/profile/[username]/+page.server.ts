/**
 * @file +page.server.ts
 *
 * @brief Server endpoints for the other-user profile page: house-scoped profile loading and avatar update action.
 *
 * @details Exposes one load function and one form action.
 * - load: authenticated loader resolving the profile from the [username]
 *   route param (URL-decoded) and returning its hero/stats fields with SEO
 *   metadata. Access is restricted to the caller's house: profiles outside
 *   it get a 403, and the caller's own profile without any house returns a
 *   minimal payload.
 * - actions.updateUserAvatar: authenticated action validating the
 *   "newAvatar" field against AVAILABLE_AVATARS, persisting it on the
 *   caller's account, and refreshing their house through the home WebSocket
 *   channel.
 *
 * @see HeroManager.svelte
 */

import { redirect, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad, Actions } from './$types';
import { AVAILABLE_AVATARS } from '$lib/avatars';
import { fail } from '@sveltejs/kit';
import { getIO } from "$lib/server/socketInstance";
import { HomeUpdate } from '$lib/server/homeWebSockets';

/**
 * @brief Loads the profile data for the [username] route, enforcing house-based access control.
 *
 * @param params (RouteParams) Route parameters; username (URL-encoded) of the profile to load.
 * @param locals (App.Locals) Request locals filled by the auth hooks; must contain user, otherwise the caller is redirected.
 *
 * @retval full { seo, userInfos, houseCode, isOwnProfile } when the target user shares a house with the caller (houseCode is that house's code).
 * @retval minimal { houseCode: null } when the caller views their own profile and belongs to no house.
 *
 * Other outcomes: 303 redirect to /auth/welcome when unauthenticated; error(404, 'user_not_found') when the username is unknown; error(403) when the target shares no house with the caller.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user)
		throw redirect(303, '/auth/welcome');

	const { username } = params;

	// Decode the username in case it contains special characters
	const decodedUsername = decodeURIComponent(username);

	// Fetch user by username
	const userInfos = await prisma.user.findFirst({
		where: { username: decodedUsername },
		select: {
			id: true,
			username: true,
			avatar: true,
			sharedTasksCompleted: true,
			totalDmgDealt: true,
			monstersSlayed: true,
			totalXP: true
		}
	});

	if (!userInfos)
		throw error(404, { message: 'user_not_found' });

	const house = await prisma.house.findFirst({
		where: {
			AND: [
				{ members: { some: { id: locals.user.id } } },
				{ members: { some: { id: userInfos.id } } }
			]
		}
	});

	const isOwnProfile: boolean = locals.user.id === userInfos.id;

	// If not in same house restrict access
	if (!house) {
		if (!isOwnProfile) {
			throw error(403, {
				message: 'Vous ne pouvez voir que les profils des membres de votre foyer'
			});
		} else {
			return { houseCode: null };
		}
	}

	return {
		seo: {
			title: isOwnProfile
				? "Mon profil | Rappeltout"
				: `Profil de ${userInfos.username} | Rappeltout`,
			description: isOwnProfile
				? `Consulte ton profil, ton niveau, tes statistiques et modifie ton avatar sur Rappeltout.`
				: `Consulte le profil de ${userInfos.username}, son niveau et ses statistiques sur Rappeltout.`
		},
		userInfos: {
			id: userInfos.id,
			username: userInfos.username,
			avatar: userInfos.avatar,
			sharedTasksCompleted: userInfos.sharedTasksCompleted,
			totalDmgDealt: userInfos.totalDmgDealt,
			monstersSlayed: userInfos.monstersSlayed,
			totalXP: userInfos.totalXP,
		},
		houseCode: house?.code ?? null,
		isOwnProfile,
	};
};

/**
 * @brief Handles the "updateUserAvatar" form action (posted to "?/updateUserAvatar" with multipart form data by HeroManager).
 *
 * @param request (Request) The incoming form request; expects a "newAvatar" field holding an avatar path.
 * @param locals (App.Locals) Request locals filled by the auth hooks; must contain user, otherwise the caller is redirected.
 *
 * @retval success Returns { success: true, avatar }: path validated against AVAILABLE_AVATARS, persisted, caller's house refreshed via HomeUpdate.
 * @retval failure Returns fail(400 | 500, { error }): missing/invalid "newAvatar" field or unknown avatar path (400), database update error (500).
 */
export const actions: Actions = {
	updateUserAvatar: async ({ request, locals }) => {
		if (!locals.user)
			throw redirect(303, '/auth/welcome');

		const formData = await request.formData();
		const rawAvatar = (formData.get('newAvatar'));

		if (typeof rawAvatar !== 'string')
			return fail(400, { error: "Missing or invalid data" });

		const isValidAvatar = AVAILABLE_AVATARS.some((a) => a.path === rawAvatar);
		if (!isValidAvatar)
			return fail(400, { error: "This avatar isn't available" });

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
				if (io)
					HomeUpdate(io, house.code);
			}

			return { success: true, avatar: rawAvatar };
		} catch (err) {
			return (fail(500, { error: "Internal server error" }));
		}
	}
}

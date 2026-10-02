<script lang="ts">
	/**
	 * @file +page.svelte
	 *
	 * @brief Other-user profile page (dynamic route): read-only view of another member's stats and hero progression.
	 *
	 * @details Displays the visited member's hero card (avatar, login, XP
	 * progression) via HeroManager in read-only mode (avatar change disabled),
	 * and their statistics via StatsManager. A footer recall shows whose
	 * profile is being viewed and their level (floor(totalXP / 500) + 1) when
	 * they have XP.
	 * If the visited profile belongs to the current user (isOwnProfile), the
	 * page redirects to /profile (replaceState) so the editable profile page
	 * is used instead.
	 * On mount, a Socket.IO connection is opened lazily; the house code is
	 * emitted on the "house" channel when available, and a "profileUpdated" or
	 * "HomeUpdate" event invalidates all page data so the UI stays in sync
	 * (including after the house code is regenerated from /manage_house, which
	 * reloads the fresh code and rejoins the correct room). The socket is
	 * disconnected on component destruction.
	 * Also sets SEO metadata (title, description) with fallbacks.
	 *
	 * Expected SvelteKit load data (data):
	 * - houseCode (string | null): code of the visited user's house, emitted on socket connection.
	 * - isOwnProfile (boolean): true if the visited profile is the current user's, triggering redirect to /profile.
	 * - notifications (array): forwarded to the header, defaults to [].
	 * - seo (object | undefined): { title, description } for the page head.
	 * - userInfos (object): { id, username, avatar, sharedTasksCompleted,
	 *   totalDmgDealt, monstersSlayed, totalXP }, with a fallback default
	 *   object when absent.
	 *
	 * @param data (object) Page data provided by the SvelteKit load function, keyed by the [username] route parameter.
	 *
	 * @see Header.svelte
	 * @see HeroManager.svelte
	 * @see StatsManager.svelte
	 */

	import Header from "$lib/components/Header.svelte";
	import { Star } from "@lucide/svelte";
	import StatsManager from "$lib/components/profile/StatsManager.svelte";
	import HeroManager from "$lib/components/profile/HeroManager.svelte";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll, goto } from "$app/navigation";

	let { data } = $props();

	let socket: Socket | null = $state(null);

	let house_code: string | null = $derived(data.houseCode ?? null);
	let previousHouseCode: string | undefined;
	let isOwnProfile: boolean | undefined = $derived(
		data.isOwnProfile ?? false,
	);
	let userInfos = $derived(
		data.userInfos ?? {
			id: 0,
			username: "",
			avatar: "/avatars/hat.png",
			sharedTasksCompleted: 0,
			totalDmgDealt: 0,
			monstersSlayed: 0,
			totalXP: 0,
		},
	);

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		if (house_code) socket.emit("house", house_code);
		socket.on("profileUpdated", () => invalidateAll());
		// The house code can be regenerated from the household management page:
		// reload so we pick up the new code and rejoin the right room below.
		socket.on("HomeUpdate", () => invalidateAll());
	});

	$effect(() => {
		// Redirect if someone tries to access their own profile via dynamic route.
		if (isOwnProfile) {
			goto("/profile", { replaceState: true });
		}

		// Join the household room, and rejoin it if the house code changes.
		if (!socket || !house_code) return;

		if (previousHouseCode && previousHouseCode !== house_code) {
			socket.emit("leaveHouse", previousHouseCode);
		}
		socket.emit("house", house_code);
		previousHouseCode = house_code;
	});

	onDestroy(() => {
		if (socket) socket.disconnect();
	});
</script>

<svelte:head>
	<title>{data.seo?.title ?? "Profil | Rappeltout"}</title>
	<meta name="description" content={data.seo?.description ?? ""} />
</svelte:head>

<main class="min-h-screen bg-background font-serif">
	<Header
		url="/house"
		text="Foyer"
		title={isOwnProfile ? "Mon profil" : `Profil de ${userInfos.username}`}
		Icon={Star}
		right="nothing"
		notifications={data.notifications || []}
		unread_count={data.unreadCount}
	/>

	<div
		class="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10 flex flex-col gap-8"
	>
		<section aria-label="Informations du héros">
			<HeroManager
				avatarUrl={userInfos.avatar}
				userLogin={userInfos.username}
				userTotalXp={userInfos.totalXP}
				onAvatarChange={undefined}
				canChangeAvatar={false}
			/>
		</section>

		<section aria-label="Statistiques du joueur">
			<StatsManager
				tasks={userInfos.sharedTasksCompleted}
				xpTotal={userInfos.totalXP}
				dmgTotal={userInfos.totalDmgDealt}
				monstersSlayed={userInfos.monstersSlayed}
			/>
		</section>

		{#if !isOwnProfile && userInfos.username}
			<div class="text-center py-8">
				<p class="text-sm text-gray-500">
					Vous consultez le profil de <strong
						>{userInfos.username}</strong
					>
				</p>
				{#if userInfos.totalXP > 0}
					<p class="text-xs text-gray-400 mt-2">
						Niveau {Math.floor(userInfos.totalXP / 500) + 1}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</main>

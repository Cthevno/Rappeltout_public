<script lang="ts">
	/**
	 * @file +page.svelte
	 *
	 * @brief Profile page: shows the user's stats, their hero progression and badges, and lets them edit their hero avatar.
	 *
	 * @details Displays the hero card (avatar, login, XP progression) via
	 * HeroManager, and the player's statistics (completed shared tasks, total
	 * XP, total damage dealt, monsters slain) via StatsManager.
	 * The avatar can be changed from the hero card: the new avatar path is
	 * posted to the "?/updateUserAvatar" action as multipart form data; the
	 * result is applied through applyAction() and all page data is reloaded
	 * with invalidateAll().
	 * On mount, a Socket.IO connection is opened lazily and the user's house
	 * code is emitted on the "house" channel; a subsequent "profileUpdated" or
	 * "HomeUpdate" event invalidates all page data so the UI stays in sync
	 * (including after the house code is regenerated from /manage_house, which
	 * reloads the fresh code and rejoins the correct room). The socket is
	 * disconnected on component destruction.
	 *
	 * Expected SvelteKit load data (data):
	 * - houseCode (string | null): code of the user's house, emitted on socket connection.
	 * - notifications (array): forwarded to the header.
	 * - userInfos (object): { avatar, username, totalXP, sharedTasksCompleted,
	 *   totalDmgDealt, monstersSlayed }.
	 *
	 * @param data (object) Page data provided by the SvelteKit load function.
	 *
	 * @see Header.svelte
	 * @see HeroManager.svelte
	 * @see StatsManager.svelte
	 */

	import Header from "$lib/components/Header.svelte";
	import { Star, X } from "@lucide/svelte";
	import StatsManager from "$lib/components/profile/StatsManager.svelte";
	import HeroManager from "$lib/components/profile/HeroManager.svelte";
	import { applyAction } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";

	let { data } = $props();

	let socket: Socket | null = $state(null);

	let house_code: string | null = $derived(data.houseCode);
	let previousHouseCode: string | undefined;

	let avatarError: string | null = $state(null);
	let avatarErrorTimeout: ReturnType<typeof setTimeout> | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		socket.on("profileUpdated", () => invalidateAll());
		// The house code can be regenerated from the household management page:
		// reload so we pick up the new code and rejoin the right room below.
		socket.on("HomeUpdate", () => invalidateAll());
	});

	$effect(() => {
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
		if (avatarErrorTimeout) clearTimeout(avatarErrorTimeout);
	});

	/**
	 * @brief Displays an error message related to avatar updates temporarily.
	 * @details Sets the `avatarError` state with the provided message and sets a
	 *          timeout to automatically clear the error message after 2 seconds.
	 *          Clears any existing timeout if a new error is triggered beforehand.
	 * @param message (string) The error message to display to the user.
	 * @return (void)
	 */
	function showAvatarError(message: string) {
		avatarError = message;
		if (avatarErrorTimeout) clearTimeout(avatarErrorTimeout);
		avatarErrorTimeout = setTimeout(() => {
			avatarError = null;
		}, 2000);
	}

	/**
	 * @brief Handles the asynchronous update of the user's avatar.
	 * @details Sends the new avatar path to the server via a form action (`?/updateUserAvatar`),
	 *          applies the action result, and invalidates all page data if successful.
	 *          Displays an error message and returns false if the request fails.
	 * @param newAvatarPath (string) The file path or URL of the new avatar selected by the user.
	 * @return (Promise<boolean>) True if the avatar was updated successfully, false otherwise.
	 */
	async function handleAvatarChange(newAvatarPath: string): Promise<boolean> {
		avatarError = null;

		const formData = new FormData();
		formData.set("newAvatar", newAvatarPath);

		try {
			const response = await fetch("?/updateUserAvatar", {
				method: "POST",
				body: formData,
			});
			if (!response.ok) {
				throw new Error(
					`Server error while updating avatar: ${response.status}`,
				);
			}
			const result = await response.json();

			if (result?.type === "failure" || result?.type == "error") {
				throw new Error(
					result?.data?.error ??
						"Echec de la mise a jour de l'avatar",
				);
			}
			applyAction(result);
			await invalidateAll();
			return true;
		} catch (err) {
			showAvatarError("Erreur lors du changement d'avatar.");
			return false;
		}
	}
</script>

<main class="min-h-screen bg-background font-serif">
	<Header
		url="/home"
		text="Accueil"
		title="Mon profil"
		Icon={Star}
		right="nothing"
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>

	<div
		class="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10 flex flex-col gap-8"
	>
		{#if avatarError}
			<div
				role="alert"
				class="flex items-center justify-between gap-3 rounded-xl border-2 border-dark-golden bg-beige text-background-red px-4 py-3 text-sm font-serif shadow-sm"
			>
				<p>{avatarError}</p>
				<button
					type="button"
					onclick={() => (avatarError = null)}
					class="shrink-0 cursor-pointer"
					aria-label="Fermer le message d'erreur"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		{/if}

		{#if data.userInfos}
			<section aria-label="Informations du héros">
				{#if data.userInfos}
					<HeroManager
						avatarUrl={data.userInfos.avatar}
						userLogin={data.userInfos.username}
						userTotalXp={data.userInfos.totalXP}
						onAvatarChange={handleAvatarChange}
						canChangeAvatar={true}
					/>
				{/if}
			</section>

			<section aria-label="Statistiques du joueur">
				{#if data.userInfos}
					<StatsManager
						tasks={data.userInfos.sharedTasksCompleted}
						xpTotal={data.userInfos.totalXP}
						dmgTotal={data.userInfos.totalDmgDealt}
						monstersSlayed={data.userInfos.monstersSlayed}
					/>
				{/if}
			</section>
		{:else}
			<div class="p-6 text-center">
				<p class="text-xl font-bold">
					Impossible de charger les informations du profil.
				</p>
			</div>
		{/if}
	</div>
</main>

<script lang="ts">
	/**
	 * @file HeroManager.svelte
	 *
	 * @brief Component used to print an hero informations, Avatar, xp progression, level
	 * It can also allows the user to change their avatar image.
	 *
	 * @param avatarUrl (string) The URL or path of the current user avatar image.
	 * @param userLogin (string) The login or username of the hero/user displayed.
	 * @param userTotalXp (number) The total experience points accumulated by the user, used to compute the level and current progress.
	 * @param onAvatarChange ((newAvatar: string) => void) Optional callback invoked when the user picks a new avatar, receiving the new avatar path as argument.
	 * @param canChangeAvatar (boolean) Whether the user is allowed to change their avatar. Optional, defaults to true.
	 */

	import ProgressBar from "../ProgressBar.svelte";
	import { Pencil } from "@lucide/svelte";
	import { AVAILABLE_AVATARS } from "$lib/avatars";

	let {
		avatarUrl,
		userLogin,
		userTotalXp,
		onAvatarChange,
		canChangeAvatar = true,
	}: {
		avatarUrl: string;
		userLogin: string;
		userTotalXp: number;
		onAvatarChange?: (newAvatar: string) => Promise<boolean>;
		canChangeAvatar?: boolean;
	} = $props();

	let currentAvatar = $state("");
	$effect(() => {
		currentAvatar = avatarUrl;
	});

	let isMenuOpen = $state(false);
	let isUpdating = $state(false);
	let containerEl: HTMLElement;

	const availableAvatars = AVAILABLE_AVATARS;

	/**
	 * @brief Selects and updates the user's avatar, triggering the change callback if provided.
	 * @details Updates the local avatar state optimistically, closes the selection menu, and invokes
	 *          the `onAvatarChange` callback. If the server update fails, it reverts back to the previous avatar.
	 * @param  path (string) The file path or URL of the newly selected avatar.
	 * @return (Promise<void>)
	 */
	async function selectAvatar(path: string) {
		const previousAvatar = currentAvatar;
		currentAvatar = path;
		isMenuOpen = false;
		if (!onAvatarChange) return;
		isUpdating = true;
		try {
			const success = await onAvatarChange(path);
			if (!success) currentAvatar = previousAvatar;
		} finally {
			isUpdating = false;
		}
	}

	/**
	 * @brief Handles click events outside the component container to close the avatar selection menu.
	 * @param event (MouseEvent) The mouse click event object.
	 * @return (void)
	 */
	function handleOutsideClick(event: MouseEvent) {
		if (containerEl && !containerEl.contains(event.target as Node)) {
			isMenuOpen = false;
		}
	}

	let currentLevel = $derived(Math.floor(userTotalXp / 500) + 1);
	let currentXpInLevel = $derived(userTotalXp % 500);
</script>

<svelte:window onclick={handleOutsideClick} />

<section
	bind:this={containerEl}
	class="relative flex flex-col items-center mt-2 px-4 w-full"
>
	{#if canChangeAvatar}
		<div class="relative inline-block">
			<!-- Avatar Button -->
			<button
				type="button"
				onclick={() => (isMenuOpen = !isMenuOpen)}
				disabled={isUpdating}
				class="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-golden bg-beige focus:outline-none focus:ring-4 focus:ring-golden shadow-md cursor-pointer"
				title="Changer d'avatar"
			>
				<img
					src={currentAvatar}
					alt="Avatar"
					class="w-3/4 h-3/4 object-contain"
				/>
			</button>

			<!-- Pencil icon to improve UX -->
			<div
				class="absolute bottom-1 right-1 bg-beige border-2 border-golden rounded-full p-2 shadow-md pointer-events-none text-golden flex items-center justify-center z-10"
			>
				<Pencil class="w-4 h-4 sm:w-5 sm:h-5" />
			</div>

			<!-- Avatars menu selection -->
			{#if isMenuOpen}
				<div
					class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-beige border-2 border-golden rounded-xl shadow-xl z-30 p-2 flex flex-col gap-1"
				>
					<p
						class="text-xs italic text-center text-grey border-b border-golden/30 pb-1 mb-1"
					>
						Choisir un avatar
					</p>
					<div
						class="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1"
					>
						{#each availableAvatars as av}
							<button
								type="button"
								onclick={() => selectAvatar(av.path)}
								class="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-golden/20 transition-colors text-left w-full cursor-pointer"
							>
								<img
									src={av.path}
									alt={av.name}
									class="w-8 h-8 rounded-full object-contain bg-beige/50 border border-golden shrink-0 p-1"
								/>
								<p class="text-sm font-serif truncate">
									{av.name}
								</p>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="relative inline-block">
			<!-- Avatar -->
			<div
				class="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-golden bg-beige shadow-md"
			>
				<img
					src={currentAvatar}
					alt="Avatar"
					class="w-3/4 h-3/4 object-contain"
				/>
			</div>
		</div>
	{/if}

	<!-- Login -->
	<div class="flex items-center justify-center gap-2 mt-3">
		<p class="text-xl font-serif">
			{userLogin}
		</p>
	</div>

	<!-- Bloc level and XP -->
	<div
		class="flex flex-col font-serif mt-4 rounded-xl border-2 border-golden bg-beige w-full max-w-md shadow-sm p-3"
	>
		<div class="flex items-center justify-between mb-2">
			<p class="text-xs italic tracking-wider text-grey">
				Niveau {currentLevel}
			</p>
		</div>
		<ProgressBar
			current={currentXpInLevel}
			max={500}
			color="bg-golden"
			textColor="text-golden"
			bgColor="bg-beige"
			label="XP"
		/>
	</div>
</section>

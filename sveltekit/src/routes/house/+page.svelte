<script lang="ts">
	/**
	 * @file +page.svelte
	 *
	 * @brief House ("foyer") overview page: shows the house identity, its members, and management shortcuts.
	 *
	 * @details Displays a banner with the house name, its member count (with
	 * singular/plural handling) and its creation date (formatted fr-FR).
	 * Lists every house member as a clickable row redirecting to their profile
	 * page (/profile/username), showing their level (computed as
	 * floor(totalXP / 500) + 1) and total XP.
	 * Provides two management actions: opening the member invitation form
	 * (submitted to the "?/inviteMember" action) and navigating to the house
	 * management page.
	 *
	 * Expected SvelteKit load data (data):
	 * - houseName (string | undefined): name of the house.
	 * - members (array): members with id, username, totalXP, role.
	 * - houseCreationDate (Date): house creation date.
	 * - notifications (array): forwarded to the header.
	 *
	 * @param data (object) Page data provided by the SvelteKit load function.
	 * @param form (object) Result of the last form action, forwarded to the invitation form.
	 *
	 * @see Header.svelte
	 * @see TitleInLines.svelte
	 * @see ButtonHorizontal.svelte
	 * @see TabButton.svelte
	 * @see FormInvitation.svelte
	 */

	// Components
	import Header from "$lib/components/Header.svelte";
	import TitleInLines from "$lib/components/TitleInLines.svelte";
	import ButtonHorizontal from "$lib/components/ButtonHorizontal.svelte";
	import TabButton from "$lib/components/monster/TabButton.svelte";
	import FormInvitation from "$lib/components/FormInvitation.svelte";
	// Icons
	import WandSparkles from "@lucide/svelte/icons/wand-sparkles";
	import Send from "@lucide/svelte/icons/send";
	import Settings from "@lucide/svelte/icons/settings";
	import Users from "@lucide/svelte/icons/users";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { Role } from "@prisma/client";

	let { data, form } = $props();

	let socket: Socket | null = $state(null);
	let house_code: string | undefined = $derived(data.code);
	let previousHouseCode: string | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
	});

	$effect(() => {
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

	function notifyHouseChanged() {
		socket?.emit("houseChanged", { houseCode: house_code });
	}

	let houseName: string | undefined = $derived(data.houseName);
	let memberCount: number = $derived(data.members.length);
	const houseCreationDate: string = $derived(
		data.houseCreationDate.toLocaleDateString("fr-FR"),
	);

	let open_form = $state(false);

	// Generate profile URL for each member
	let memberProfileLinks = $derived(
		data.members.map((member) => ({
			...member,
			profileUrl: `/profile/${encodeURIComponent(member.username)}`,
		})),
	);

	/**
	 * @brief Returns the French display label for a member's role.
	 * @param role (Role) The member's role.
	 * @return (string) "DIRECTEUR", "PROFESSEUR" or "ETUDIANT".
	 */
	function formating(role: Role) {
		if (role == Role.HEADMASTER) return "DIRECTEUR";
		else if (role == Role.TEACHER) return "PROFESSEUR";
		else return "ETUDIANT";
	}
</script>

<div class="m-0 min-h-screen bg-background font-serif">
	<Header
		title="Mon foyer"
		Icon={Users}
		right="code"
		code={data.code}
		url="/home"
		text="Accueil"
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>

	<!-- The div container to constrain the width of the page elements. -->
	<div class="mx-auto max-w-4xl px-4">
		<!-- House name -->
		<div class="flex items-center justify-left">
			<div class="rounded-xl bg-background-red mx-1 my-4 px-4 py-4">
				<WandSparkles class="stroke-dull-gold" />
			</div>
			<div class="mx-4 py-5">
				<h1>Foyer {houseName}</h1>
				<p class="text-xs">
					{#if memberCount === 1}
						{memberCount} membre · fondé le {houseCreationDate}
					{:else}
						{memberCount} membres · fondé le {houseCreationDate}
					{/if}
				</p>
			</div>
		</div>

		<!-- Members separator -->
		<TitleInLines title="✦ MEMBRES ✦" />

		<!-- House members buttons -->
		<div class="flex flex-col gap-2">
			{#each memberProfileLinks as member (member.id)}
				<ButtonHorizontal
					href={member.profileUrl}
					login={member.username}
					avatar={member.avatar}
					role={formating(member.role)}
					stats={"Niveau " +
						(Math.floor(member.totalXP / 500) + 1) +
						" · " +
						member.totalXP +
						" XP"}
				/>
			{/each}
		</div>

		<!-- Management buttons -->
		<div class="flex flex-col min-[400px]:flex-row gap-2 mt-8 w-full">
			{#if data.current_user.role !== Role.STUDENT}
				<TabButton
					label="Inviter un membre"
					active={false}
					logo={Send}
					bind:open_form
				/>
			{/if}

			<a href="manage_house" class="grid">
				<TabButton
					label="Gérer le foyer"
					active={false}
					logo={Settings}
				/>
			</a>
		</div>
	</div>

	{#if open_form && data.current_user.role !== Role.STUDENT}
		<FormInvitation
			bind:open_form
			formaction="?/inviteMember"
			{form}
			onSuccess={notifyHouseChanged}
		/>
	{/if}
</div>

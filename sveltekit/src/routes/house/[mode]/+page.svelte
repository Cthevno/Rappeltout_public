<script lang="ts">
	import { page } from "$app/state";

	import ButtonValidate2 from "$lib/components/ButtonValidate2.svelte";
	import Header from "$lib/components/Header.svelte";
	import HouseholdTabs from "$lib/components/HouseholdTabs.svelte";
	import InformationalMessage from "$lib/components/InformationalMessage.svelte";
	import CreateHouseForm from "$lib/components/CreateHouseForm.svelte";
	import { Users, Wand, ScanBarcode, Sparkle } from "@lucide/svelte";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";

	let { data, form } = $props();

	/** Retrieves the page mode, i.e. create or join. */
	let mode = $derived(page.params.mode);

	/** Stores the household name entered by the user.*/
	let household_name = $state("");

	/** Checks whether the create form is valid, i.e. whether the household_name
	 * field is filled in; stores true if valid.
	 */
	const form_create_is_valid = $derived(
		household_name.trim().length > 0 && household_name.trim().length < 61,
	);
	let isTooLong = $derived(household_name.trim().length < 61);
	/** Stores the code entered by the user.*/
	let code = $state("");

	/** Checks whether the join form is valid, i.e. whether the code field
	 * is filled in; stores true if valid.
	 */
	const form_join_is_valid = $derived(
		code.trim().length > 0 && code.trim().length < 21,
	);
	let isTooLongCode = $derived(code.trim().length < 21);

	let socket: Socket | null = $state(null);

	let house_code: string | null = $derived(code);
	let previousHouseCode: string | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		socket.on("HomeUpdate", () => invalidateAll());
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
</script>

<main class="min-h-screen bg-background font-serif">
	<Header
		url="/home"
		text="Accueil"
		title="Nouveau foyer"
		Icon={Users}
		right="logout"
		notifications={data.notifications}
		showBack={data.hasHouse}
		settings={true}
		unread_count={data.unreadCount}
	/>
	<div class="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
		{#if mode === "create"}
			<HouseholdTabs active_mode="create" />
			<InformationalMessage
				text="Tu deviendras le Gardien·ne de ce nouveau foyer et recevras
                    un code d'invitation à partager."
			/>
			<form class="mt-6 space-y-5" method="POST">
				<CreateHouseForm
					id="household_name"
					label="Nom du foyer"
					placeholder="Ex : Foyer Dupont, La Tanière..."
					Icon={Wand}
					autocomplete="organization"
					required
					maxlength={60}
					bind:value={household_name}
				/>
				{#if form?.error}
					<p class="text-red text-center">{form.error}</p>
				{:else if !isTooLong}
					<p class="text-red">
						Le nom ne peut pas faire plus de 60 caractères.
					</p>
				{/if}
				<ButtonValidate2
					text="Fonder le foyer"
					disabled={!form_create_is_valid}
					Icon={Sparkle}
					formaction="?/create"
				/>
			</form>
		{:else if mode === "join"}
			<HouseholdTabs active_mode="join" />
			<InformationalMessage
				text="Saisis le code d'invitation partagé par le Gardien·ne du
                    foyer. Un hibou sera envoyé pour confirmer ton adhésion."
			/>
			<form class="mt-6 space-y-5" method="POST">
				<CreateHouseForm
					id="code"
					label="Code d'invitation"
					placeholder="Ex : LUMOS-42"
					Icon={ScanBarcode}
					autocomplete="organization"
					required
					bind:value={code}
				/>
				{#if form?.error}
					<p class="text-red text-center">{form.error}</p>
				{:else if !isTooLongCode}
					<p class="text-red">Le code est trop long.</p>
				{/if}
				{#if form?.success}
					<p class="text-green text-center">
						Ton hibou a bien décollé ! Une fois que ta demande aura
						été acceptée, tu auras accès au foyer et au reste des
						fonctionnalitées.
					</p>
				{/if}
				<ButtonValidate2
					text="Envoyer le hibou"
					disabled={!form_join_is_valid}
					Icon="game-icons:owl"
					formaction="?/join"
				/>
			</form>
		{/if}
	</div>
</main>

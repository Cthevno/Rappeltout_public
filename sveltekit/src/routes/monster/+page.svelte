<script lang="ts">
	/**
	 * @file +page.svelte
	 * @brief Monster page
	 * @details This is the page where players can see the common objective, their rank and the loot.
	 */

	import Header from "$lib/components/Header.svelte";
	import { Skull } from "@lucide/svelte";
	import MonsterInfos from "$lib/components/monster/MonsterInfos.svelte";
	import MonsterCard from "$lib/components/monster/MonsterCard.svelte";
	import ProgressBar from "$lib/components/ProgressBar.svelte";
	import DamageList from "$lib/components/monster/DamageList.svelte";
	import CombatLog from "$lib/components/monster/CombatLog.svelte";
	import LootManager from "$lib/components/monster/loot/LootManager.svelte";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";

	let { data } = $props();

	let socket: Socket | null = $state(null);

	let house_code: string | null = $derived(data.houseCode);
	let previousHouseCode: string | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		socket.on("monsterUpdated", () => invalidateAll());
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

	let activeMonster = $derived(data.activeMonster);
	let players = $derived(data.players ?? []);
	let combatLogsFormatted = $derived(
		(activeMonster?.combatLogs ?? []).map((log) => ({
			login: log.user?.username ?? "Unknown",
			dmg: log.dmg,
			// Convert Prisma date to the appropriate format (Date or string), format "YYYY-MM-DD"
			date: new Date(log.createdAt).toISOString().split("T")[0],
		})),
	);
	let lootType = $derived(data.activeMonster?.lootType);
</script>

<div class="m-0 min-h-screen bg-background font-serif">
	<Header
		url="/home"
		text="Accueil"
		title="Le Monstre du Foyer"
		Icon={Skull}
		right="nothing"
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>

	<nav
		class="flex justify-center gap-2 mt-6 px-4 w-full overflow-x-auto no-scrollbar"
	></nav>
	{#if activeMonster}
		<MonsterCard>
			<MonsterInfos monster={activeMonster} />
			<ProgressBar
				current={activeMonster.currentHp}
				max={activeMonster.maxHp}
				color="bg-red"
				textColor="text-background-red"
				bgColor="bg-beige"
				label="PV"
			/>
			<LootManager
				{players}
				monsterId={activeMonster.id}
				{activeMonster}
				lootType={activeMonster.lootType}
				currentUser={data.current_user}
			/>
		</MonsterCard>
		<DamageList {players} />
		<CombatLog combatLog={combatLogsFormatted} />
	{:else}
		<div class="p-6 text-center">
			<p class="text-xl font-bold">
				Aucun monstre actif pour le moment !
			</p>
		</div>
	{/if}
</div>

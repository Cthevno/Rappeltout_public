<script lang="ts">
	/**
	 * @file +page.svelte
	 * @brief Displays the main authenticated home page.
	 *
	 * @details This page displays:
	 * - the dashboard header;
	 * - the welcome section;
	 * - the navigation modules;
	 * - the progress information;
	 * - the visual house selector modal.
	 *
	 * User information is received from:
	 * src/routes/home/+page.server.ts
	 *
	 * The layout is mobile-first:
	 * - 2 columns on mobile;
	 * - 3 columns on tablets and larger screens.
	 *
	 * @see DashboardHeader.svelte
	 * @see DashboardModuleCard.svelte
	 * @see HouseSelector.svelte
	 */

	import type { Component } from "svelte";

	// ============================================================
	// Component imports
	// ============================================================

	import DashboardHeader from "$lib/components/DashboardHeader.svelte";
	import DashboardModuleCard from "$lib/components/DashboardModuleCard.svelte";
	import HouseSelector from "$lib/components/HouseSelector.svelte";
	import AboutLink from "$lib/components/about/AboutLink.svelte";

	// ============================================================
	// Icon imports
	// ============================================================

	import {
		BrushCleaning,
		Calendar,
		House,
		ListChecks,
		MessageCircle,
		ShoppingCart,
		Skull,
		Star,
		Users,
		Wallet,
	} from "@lucide/svelte";

	// ============================================================
	// Socket import
	// ============================================================

	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";

	// ============================================================
	// Page data structure
	// ============================================================

	/**
	 * Describes the data returned by:
	 * src/routes/home/+page.server.ts
	 */
	type NotificationData = {
		id: number;
		type: "MONSTER" | "TASK" | "XP" | "CHALLENGE" | "INVITATION";
		title: string;
		message: string;
		isRead: boolean;
		createdAt: Date;
		href: string | null;
	};

	type PageData = {
		user: {
			username: string;
		};
		notifications: NotificationData[];
	};

	/** Receives the page data provided by +page.server.ts. */
	let { data } = $props();

	// ============================================================
	// Socket part
	// ============================================================

	let socket: Socket | null = $state(null);

	let house_code: string | null = $derived(data.houseData.houseCode);
	let previousHouseCode: string | undefined;

	onMount(async () => {
		const { io } = await import("socket.io-client");
		socket = io();
		socket.on("monsterUpdated", () => invalidateAll());
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

	// ============================================================
	// Header menu structure
	// ============================================================

	/**
	 * Lists the menus that can be opened in DashboardHeader.
	 *
	 * null means that no header dropdown is open.
	 */
	type HeaderMenu = "notifications" | "settings" | null;

	// ============================================================
	// Dashboard card structure
	// ============================================================

	/**
	 * Describes the structure of a dashboard card.
	 *
	 * Required properties:
	 * - title: main card title;
	 * - description: secondary information;
	 * - href: route opened when the card is clicked;
	 * - Icon: Lucide icon displayed on the card.
	 *
	 * Optional properties:
	 * - active: visually highlights the card;
	 * - progress_value: current progress value;
	 * - progress_max: maximum progress value.
	 */
	type DashboardCardData = {
		title: string;
		description: string;
		href: string;
		Icon: Component;
		active?: boolean;
		progress_value?: number;
		progress_max?: number;
		inprogress?: boolean;
	};

	// ============================================================
	// Dashboard card data
	// ============================================================

	/**
	 * Contains all modules displayed in the dashboard grid.
	 *
	 * The page stores only the data.
	 * DashboardModuleCard is responsible for the card display.
	 */
	const dashboard_cards = $derived([
		{
			title: "Tâches ménagères",
			description: `Il te reste ${data.houseData.mineTasks} tâche(s) à faire`,
			href: "/household_chores",
			Icon: BrushCleaning,
			active: true,
		},
		{
			title: data.houseData.monsterName,
			description: `${data.houseData.currentPV} / ${data.houseData.maxPV} PV restants`,
			href: "/monster",
			Icon: Skull,
			progress_value: data.houseData.currentPV,
			progress_max: data.houseData.maxPV,
		},
		{
			title: "Mon profil",
			description: `Niveau ${Math.floor(data.houseData.totalXP / 500) + 1} · ${data.houseData.totalXP % 500} / 500 XP`,
			href: "/profile",
			Icon: Star,
			progress_value: data.houseData.totalXP % 500,
			progress_max: 500,
		},
		{
			title: "Mes tâches perso",
			description: "Visibles par toi seul·e",
			href: "/todo",
			Icon: ListChecks,
		},
		{
			title: "Mon foyer",
			description: `${data.houseData.members} membre(s) et ${data.houseData.pendingMembers} invitation(s)`,
			href: "/house",
			Icon: Users,
		},
		{
			title: "Chat familial",
			description: "Viens discuter avec les membres du foyer",
			href: "/chat",
			Icon: MessageCircle,
		},
		{
			title: "Calendrier",
			description: "Bientôt : Événements et rendez-vous",
			href: "/home",
			Icon: Calendar,
			inprogress: true,
		},
		{
			title: "Courses",
			description: "Bientôt : Liste partagée du foyer",
			href: "/home",
			Icon: ShoppingCart,
			inprogress: true,
		},
		{
			title: "Budget",
			description: "Bientôt : Revenus et dépenses",
			href: "/home",
			Icon: Wallet,
			inprogress: true,
		},
	] as DashboardCardData[]);

	// ============================================================
	// Page state
	// ============================================================

	/**
	 * Stores the currently open dropdown in DashboardHeader.
	 */
	let open_header_menu = $state<HeaderMenu>(null);

	/**
	 * Controls the visibility of the visual house selector modal.
	 */
	let house_selector_open = $state(false);

	// ============================================================
	// Page actions
	// ============================================================

	/**
	 * @brief Opens the house selector modal.
	 *
	 * @details Before opening the modal, every dropdown from DashboardHeader
	 * is closed to prevent interfaces from overlapping.
	 * @returns (void)
	 */
	function open_house_selector() {
		open_header_menu = null;
		house_selector_open = true;
	}
</script>

<!-- ============================================================
     Main authenticated home page
     ============================================================ -->

<main class="min-h-screen bg-background font-sans">
	<!--
		The page and DashboardHeader share the open menu state.

		This allows the page to close all header dropdowns before
		opening the house selector modal.
	-->
	<DashboardHeader
		bind:open_menu={open_header_menu}
		notifications={data.notifications}
		unread_count={data.unreadCount}
	/>

	<div class="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
		<!-- ======================================================
		     Welcome section
		     ====================================================== -->

		<section class="mb-8 flex items-center gap-3 md:mb-10 md:gap-4">
			<div
				class="flex items-center justify-center h-12 w-12 shrink-0 rounded-full border-2 border-background-icon bg-beige md:h-14 md:w-14"
			>
				<img
					src={data.houseData.currentAvatar}
					alt="Avatar"
					class="w-3/4 h-3/4 object-contain"
				/>
			</div>

			<div>
				<h2 class="text-3xl font-bold leading-tight md:text-4xl">
					Bonjour, {data.user.username} ✦
				</h2>

				<p class="mt-1 text-sm text-grey md:mt-2 md:text-base">
					Il reste {data.houseData.todoTasks} tâche(s) — le foyer en a
					accompli {data.houseData.finishTasks} sur
					{data.houseData.totalTasks}
				</p>
			</div>
		</section>

		<!-- ======================================================
		     Section separator
		     ====================================================== -->

		<div class="mb-6 flex items-center gap-4 md:mb-8 md:gap-6">
			<div class="h-px flex-1 bg-background-icon"></div>

			<h3
				class="text-xs font-semibold uppercase tracking-[0.25em] text-grey md:text-sm md:tracking-[0.35em]"
			>
				✦ Modules ✦
			</h3>

			<div class="h-px flex-1 bg-background-icon"></div>
		</div>

		<!-- ======================================================
		     Dashboard module grid
		     ====================================================== -->

		<!--
			Two columns on mobile and three columns
			from the md breakpoint.
		-->
		<section
			class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4"
			aria-label="Modules de l'accueil"
		>
			{#each dashboard_cards as card (card.title)}
				<DashboardModuleCard
					title={card.title}
					description={card.description}
					href={card.href}
					Icon={card.Icon}
					active={card.active ?? false}
					progress_value={card.progress_value}
					progress_max={card.progress_max}
					inprogress={card.inprogress ?? false}
				/>
			{/each}
		</section>

		<!-- ======================================================
		     House selector button
		     ====================================================== -->

		<div class="mt-8 flex justify-center md:mt-10">
			<button
				type="button"
				class="flex items-center gap-2 rounded-full border-2 border-background-icon bg-beige px-6 py-2.5 text-sm text-grey shadow-sm transition hover:scale-[1.02] hover:shadow-md md:px-8 md:py-3 md:text-base"
				onclick={open_house_selector}
			>
				<House size={18} class="text-red" />

				Changer de maison
			</button>
		</div>
	</div>

	<!-- ==========================================================
	     Visual house selector modal
	     ========================================================== -->

	<HouseSelector bind:open={house_selector_open} />

	<AboutLink />
</main>

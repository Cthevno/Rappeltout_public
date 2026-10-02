<script lang="ts">
	/**
	 * @file DashboardHeader.svelte
	 * @brief Displays the main dashboard header.
	 *
	 * @details Shows the application logo and name, the notification dropdown, and the settings dropdown.
	 *
	 * Responsive behavior:
	 * - the application name is hidden on small screens;
	 * - action buttons remain accessible on all screen sizes.
	 */

	// ============================================================
	// Component imports
	// ============================================================

	import NotificationDropdown from "$lib/components/NotificationDropdown.svelte";
	import Logo from "$lib/components/Logo.svelte";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";

	// ============================================================
	// Icon imports
	// ============================================================

	import { Bell, ChevronRight, LogOut, Settings } from "@lucide/svelte";

	// ============================================================
	// Header menu types
	// ============================================================

	/**
	 * Lists the menus that can be opened in the dashboard header.
	 *
	 * A null value means that no header menu is currently open.
	 */
	type HeaderMenu = "notifications" | "settings" | null;
	type NotificationData = {
		id: number;
		type: "MONSTER" | "TASK" | "XP" | "CHALLENGE" | "INVITATION";
		title: string;
		message: string;
		isRead: boolean;
		createdAt: Date;
		href: string | null;
	};
	// ============================================================
	// Bindable component state
	// ============================================================

	/**
	 * @brief Component properties.
	 *
	 * @param open_menu (HeaderMenu) Currently open header menu.
	 * This property is bindable and defaults to null.
	 *
	 * @param notifications (NotificationData[]) Notifications displayed
	 * in the notification dropdown.
	 * @param unread_count (number) Total number of unread notifications.
	 */
	let {
		open_menu = $bindable<HeaderMenu>(null),
		notifications,
		unread_count,
	}: {
		open_menu?: HeaderMenu;
		notifications: NotificationData[];
		unread_count: number;
	} = $props();

	let socket: Socket | null = null;

	// ============================================================
	// Dropdown container references
	// ============================================================

	/**
	 * References to the three dropdown containers.
	 *
	 * They are used to determine whether a click happened inside
	 * or outside the currently open menu.
	 */
	let notifications_container: HTMLDivElement | undefined;
	let settings_container: HTMLDivElement | undefined;

	// ============================================================
	// Header menu actions
	// ============================================================

	/**
	 * @brief Opens the requested header menu.
	 *
	 * If the requested menu is already open, it is closed.
	 * Since only one menu name can be stored in open_menu,
	 * opening one menu automatically closes the previous one.
	 * @returns (void)
	 */
	function toggle_menu(menu: Exclude<HeaderMenu, null>) {
		open_menu = open_menu === menu ? null : menu;
	}

	/**
	 * @brief Closes every dropdown displayed in the header.
	 * @returns (void)
	 */
	function close_all_menus() {
		open_menu = null;
	}

	/**
	 * @brief Checks whether a click happened outside the active dropdown.
	 *
	 * When the target is not contained inside the corresponding
	 * menu container, the currently open menu is closed.
	 * @returns (void)
	 */
	function handle_window_click(event: MouseEvent) {
		if (open_menu === null) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		const active_container =
			open_menu === "notifications"
				? notifications_container
				: settings_container;

		if (active_container && !active_container.contains(target)) {
			close_all_menus();
		}
	}

	/**
	 * @brief Closes the active header menu when the user presses Escape.
	 * @returns {void}
	 */
	function handle_window_keydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			close_all_menus();
		}
	}

	onMount(async () => {
		const { io } = await import("socket.io-client");

		socket = io();

		socket.on("notificationsUpdated", () => {
			invalidateAll();
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
		}
	});
</script>

<!-- ============================================================
     Global dropdown dismissal
     ============================================================ -->

<!--
	Window events allow the component to detect interactions
	that happen outside the header dropdowns.

	- A click outside closes the active menu.
	- Pressing Escape closes the active menu.
-->
<svelte:window
	onclick={handle_window_click}
	onkeydown={handle_window_keydown}
/>

<!-- ============================================================
     Main dashboard header
     ============================================================ -->

<header class="bg-background-header shadow-sm">
	<div
		class="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-6"
	>
		<!-- ========================================================
		     Application identity
		     ======================================================== -->

		<Logo />

		<!-- ========================================================
		     Header action buttons
		     ======================================================== -->

		<div class="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
			<!-- ==================================================
			     Notification dropdown
			     ================================================== -->

			<div class="relative" bind:this={notifications_container}>
				<button
					type="button"
					aria-label="Afficher les notifications"
					aria-expanded={open_menu === "notifications"}
					class="relative rounded-full p-2 text-white transition hover:bg-white/10"
					onclick={() => toggle_menu("notifications")}
				>
					<Bell size={18} class="md:size-5" />

					<!-- Number of unread notifications -->
					{#if unread_count > 0}
						<p
							class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red text-[10px] text-white"
						>
							{unread_count}
						</p>
					{/if}
				</button>

				<!--
					The parent controls whether the notification dropdown
					is visible.

					The on_close callback allows NotificationDropdown to
					close the shared header state from inside the component.
				-->
				<NotificationDropdown
					open={open_menu === "notifications"}
					{notifications}
					{unread_count}
					on_close={close_all_menus}
				/>
			</div>

			<!-- ==================================================
			     Settings dropdown
			     ================================================== -->

			<div class="relative" bind:this={settings_container}>
				<button
					type="button"
					aria-label="Ouvrir les paramètres"
					aria-expanded={open_menu === "settings"}
					aria-controls="settings-menu"
					class="rounded-full border-2 border-background-icon bg-beige p-2 text-red transition hover:scale-[1.02] hover:shadow-md"
					onclick={() => toggle_menu("settings")}
				>
					<Settings size={18} class="md:size-5" />
				</button>

				<!--
					The settings dropdown is rendered only when
					open_menu contains "settings".
				-->
				{#if open_menu === "settings"}
					<div
						id="settings-menu"
						class="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border-2 border-background-icon bg-beige shadow-xl"
					>
						<nav aria-label="Menu des paramètres">
							<ul class="text-sm">
								<!-- Account settings -->
								<li>
									<a
										href="/settings"
										class="flex items-center gap-3 px-4 py-4 font-semibold text-grey transition hover:bg-background-icon-todo"
										onclick={close_all_menus}
									>
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background-icon-todo text-grey"
											aria-hidden="true"
										>
											<Settings size={17} />
										</div>

										<p class="flex-1">
											Paramètres du compte
										</p>

										<ChevronRight
											size={17}
											class="shrink-0"
											aria-hidden="true"
										/>
									</a>
								</li>

								<!-- Separation line -->
								<li
									class="border-t border-background-icon"
									aria-hidden="true"
								></li>

								<!-- Logout -->
								<li>
									<form method="POST" action="/auth/logout">
										<button
											type="submit"
											class="flex w-full items-center gap-3 px-4 py-4 text-left font-semibold text-red transition hover:bg-background-icon-todo"
										>
											<div
												class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red/10"
												aria-hidden="true"
											>
												<LogOut size={17} />
											</div>

											<p>Se déconnecter</p>
										</button>
									</form>
								</li>
							</ul>
						</nav>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>

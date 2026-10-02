<script lang="ts">
	/**
	 * @file Header.svelte
	 * @brief Main navigation header for pages.
	 * @details Made up of three zones: a back button on the left, a centered title (HeaderTitle)
	 * and a component of choice on the right depending on the value of `right` (e.g. NewTask button).
	 * @param title (string) Title displayed in the header.
	 * @param Icon (Component) Svelte icon displayed next to the title.
	 * @param [right] ("task" | "nothing" | "code" | "logout") Determines which component to display on the right.
	 * @param [newTaskOpen] (boolean) Shared with the parent to open or close the task creation form.
	 * @param [code] (string) Invitation code passed to Code.svelte when `right === "code"`.
	 * @param url (string) The destination of the back button, passed to ButtonBackto.svelte.
	 * @param text (string) The text of the back button, passed to ButtonBackto.svelte.
	 * @param [notifications] (NotificationData[]) Notifications of the connected user.
	 * @param unread_count (number) Total number of unread notifications, shown on the bell badge and in the dropdown.
	 * @param showBack (boolean) to show home button
	 * @param settings show icon settings
	 * @see HeaderTitle.svelte
	 * @see NewTask.svelte
	 * @see ButtonBackto.svelte
	 * @see Code.svelte
	 */

	import type { Component } from "svelte";
	import ButtonBackto from "$lib/components/ButtonBackto.svelte";
	import HeaderTitle from "$lib/components/HeaderTitle.svelte";
	import NewTask from "$lib/components/NewTask.svelte";
	import Code from "$lib/components/Code.svelte";
	import { LogOut } from "@lucide/svelte";
	import { Bell, Settings } from "@lucide/svelte";
	import NotificationDropdown from "$lib/components/NotificationDropdown.svelte";
	import type { Socket } from "socket.io-client";
	import { onMount, onDestroy } from "svelte";
	import { invalidateAll } from "$app/navigation";

	type NotificationData = {
		id: number;
		type: "MONSTER" | "TASK" | "XP" | "CHALLENGE" | "INVITATION";
		title: string;
		message: string;
		isRead: boolean;
		createdAt: Date;
		href: string | null;
	};

	let {
		title,
		Icon,
		right = "nothing",
		newTaskOpen = $bindable(false),
		code,
		url,
		text,
		notifications = [],
		unread_count,
		showBack = true,
		settings = false,
	}: {
		title: string;
		Icon: Component;
		right?: "task" | "nothing" | "code" | "logout";
		newTaskOpen?: boolean;
		code?: string;
		url: string;
		text: string;
		notifications?: NotificationData[];
		unread_count: number;
		showBack?: boolean;
		settings?: boolean;
	} = $props();
	let notifications_open = $state(false);
	let notifications_container: HTMLDivElement | undefined;

	/**
	 * @brief Closes the notification dropdown when clicking outside it.
	 * @param event (MouseEvent) Window click event.
	 */
	function handle_window_click(event: MouseEvent) {
		if (!notifications_open) return;

		const target = event.target;

		if (!(target instanceof Node)) return;

		if (
			notifications_container &&
			!notifications_container.contains(target)
		) {
			notifications_open = false;
		}
	}

	let socket: Socket | null = null;

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

<svelte:window onclick={handle_window_click} />
<div
	class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 m-0 bg-background-header h-24 px-2"
>
	<div class="col-span-1 justify-self-start">
		{#if showBack}
			<ButtonBackto {url} {text} />
		{/if}
	</div>

	<div class="flex w-full min-w-0 justify-center">
		<div class="min-w-0 truncate">
			<HeaderTitle {title} {Icon} />
		</div>
	</div>

	<div class="flex items-center justify-end gap-2">
		<div class="relative" bind:this={notifications_container}>
			<button
				type="button"
				aria-label="Afficher les notifications"
				aria-expanded={notifications_open}
				class="relative rounded-full p-[15px] text-white transition hover:bg-white/10"
				onclick={() => (notifications_open = !notifications_open)}
			>
				<Bell size={18} class="md:size-5" />

				{#if unread_count > 0}
					<p
						class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red text-[10px] text-white"
					>
						{unread_count}
					</p>
				{/if}
			</button>

			<NotificationDropdown
				open={notifications_open}
				{notifications}
				{unread_count}
				on_close={() => (notifications_open = false)}
			/>
		</div>

		{#if right === "task"}
			<NewTask stateDefault={false} bind:open={newTaskOpen} />
		{:else if right === "code"}
			{#if code}
				<div class="hidden sm:block mr-4"><Code {code} /></div>
			{/if}
		{:else if right === "logout"}
			<form method="POST" action="/auth/logout" class="mr-2">
				<button
					type="submit"
					aria-label="Se déconnecter"
					class="rounded-full border-2 border-background-icon bg-beige p-2 text-red transition hover:scale-[1.02] hover:shadow-md"
				>
					<LogOut size={22} class="md:size-6" />
				</button>
			</form>
		{/if}
		{#if settings}
			<a
				href="/settings"
				aria-label="Paramètres"
				class="rounded-full border-2 border-background-icon bg-beige p-2 text-red transition hover:scale-[1.02] hover:shadow-md"
			>
				<Settings size={18} class="md:size-5" />
			</a>
		{/if}
	</div>
</div>

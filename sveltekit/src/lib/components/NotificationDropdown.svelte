<script lang="ts">
	/**
	 * @file NotificationDropdown.svelte
	 * @brief Displays the header notification dropdown.
	 *
	 * @details
	 * Receives the authenticated user's latest notifications from the header
	 * (Header, SimpleHeader or DashboardHeader) and displays their read status.
	 *
	 * @param [open] (boolean) Controls whether the dropdown is visible.
	 * @param notifications (NotificationData[]) Latest notifications received from the server (limited to 50).
	 * @param unread_count (number) Total number of unread notifications, including those not loaded.
	 * @param [on_close] (() => void) Callback called when the dropdown requests to be closed.
	 */

	import {
		CircleCheck,
		Flame,
		Star,
		Swords,
		Trash2,
		Users,
	} from "@lucide/svelte";

	import { goto, invalidateAll } from "$app/navigation";
	// ============================================================
	// Notification data structure
	// ============================================================

	type NotificationType =
		| "MONSTER"
		| "TASK"
		| "XP"
		| "CHALLENGE"
		| "INVITATION";

	type NotificationData = {
		id: number;
		type: NotificationType;
		title: string;
		message: string;
		isRead: boolean;
		createdAt: Date;
		href: string | null;
	};

	// ============================================================
	// Component properties
	// ============================================================

	let {
		open = false,
		notifications: server_notifications,
		unread_count,
		on_close = () => {},
	}: {
		open?: boolean;
		notifications: NotificationData[];
		unread_count: number;
		on_close?: () => void;
	} = $props();

	let notifications = $state<NotificationData[]>([]);
	let error_message = $state<string | null>(null);

	$effect(() => {
		notifications = server_notifications;
	});

	// ============================================================
	// Notification visual helpers
	// ============================================================

	/**
	 * Returns the icon associated with a notification type.
	 *
	 * @param type (NotificationType) Notification type.
	 * @returns Icon component associated with the notification.
	 */
	function get_notification_icon(type: NotificationType) {
		switch (type) {
			case "MONSTER":
				return Swords;

			case "TASK":
				return CircleCheck;

			case "XP":
				return Star;

			case "CHALLENGE":
				return Flame;

			case "INVITATION":
				return Users;
		}
	}
	/**
	 * Returns the text color class associated with a notification type.
	 *
	 * @param type (NotificationType) Notification type.
	 * @returns Tailwind class used for the icon color.
	 */
	function get_icon_class(type: NotificationType): string {
		switch (type) {
			case "MONSTER":
			case "TASK":
				return "text-red";

			case "XP":
			case "CHALLENGE":
				return "text-background-icon";

			case "INVITATION":
				return "text-green-800";
		}
	}
	/**
	 * Returns the background color class associated with a notification type.
	 *
	 * @param type (NotificationType) Notification type.
	 * @returns Tailwind class used for the icon background.
	 */
	function get_icon_background_class(type: NotificationType): string {
		switch (type) {
			case "MONSTER":
				return "bg-red/10";

			case "TASK":
			case "XP":
			case "CHALLENGE":
				return "bg-background-icon-todo";

			case "INVITATION":
				return "bg-green-100";
		}
	}

	// ============================================================
	// Dropdown actions
	// ============================================================
	/**
	 * Closes the notification dropdown.
	 */
	function close_dropdown(): void {
		invalidateAll();
		on_close();
	}

	/**
	 * Marks all notifications as read.
	 *
	 * Updates the notifications through the API and synchronizes
	 * the local state when the request succeeds.
	 */
	async function mark_all_as_read(): Promise<void> {
		error_message = null;
		const response = await fetch("/api/notifications", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				all: true,
			}),
		});

		if (!response.ok) {
			error_message =
				"Impossible de marquer les notifications comme lues.";
			return;
		}

		/*
		 * Updates the local data immediately so the interface
		 * does not need to wait for a page reload.
		 */
		notifications = notifications.map((notification) => ({
			...notification,
			isRead: true,
		}));

		await invalidateAll();
	}
	/**
	 * Marks one notification as read and opens its destination.
	 *
	 * @param notification_id (number) Notification identifier.
	 * @param href (string | null | undefined) Destination associated with the notification.
	 */
	async function open_notification(
		notification_id: number,
		href: string | null | undefined,
	): Promise<void> {
		error_message = null;

		notifications = notifications.map((notification) =>
			notification.id === notification_id
				? {
						...notification,
						isRead: true,
					}
				: notification,
		);
		close_dropdown();

		const response = await fetch("/api/notifications", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: notification_id,
			}),
		});

		if (!response.ok) {
			error_message =
				"Impossible de marquer cette notification comme lue.";
			return;
		}

		await invalidateAll();

		if (href) {
			await goto(href);
		}
	}

	/**
	 * Deletes one notification.
	 *
	 * @param notification_id (number) Notification identifier.
	 */
	async function delete_notification(notification_id: number): Promise<void> {
		error_message = null;

		const response = await fetch("/api/notifications", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: notification_id,
			}),
		});

		if (!response.ok) {
			error_message = "Impossible de supprimer cette notification.";
			return;
		}

		notifications = notifications.filter(
			(notification) => notification.id !== notification_id,
		);

		await invalidateAll();
	}
</script>

{#if open}
	<div
		id="notification-menu"
		class="fixed left-3 right-3 top-[76px] z-50 max-h-[calc(100dvh-88px)] overflow-y-auto rounded-2xl border-2 border-background-icon bg-beige shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[80vh] sm:w-96"
	>
		<!-- ======================================================
		     Dropdown header
		     ====================================================== -->

		<div
			class="flex items-center justify-between border-b border-background-icon px-4 py-3"
		>
			<h2 class="text-sm font-bold sm:text-base">
				Notifications

				{#if unread_count > 0}
					<span class="text-red">
						({unread_count})
					</span>
				{/if}
			</h2>

			<button
				type="button"
				class="text-sm font-semibold text-grey transition hover:text-red disabled:cursor-default disabled:opacity-50"
				disabled={unread_count === 0}
				onclick={mark_all_as_read}
			>
				Tout lire
			</button>
		</div>
		{#if error_message}
			<p
				class="border-b border-background-icon px-4 py-2 text-sm text-red"
			>
				{error_message}
			</p>
		{/if}

		<!-- ======================================================
		     Notification list
		     ====================================================== -->

		{#if notifications.length === 0}
			<p class="px-4 py-6 text-center text-sm text-grey">
				Aucune notification.
			</p>
		{:else}
			<ul>
				{#each notifications as notification (notification.id)}
					{@const NotificationIcon = get_notification_icon(
						notification.type,
					)}

					<li
						class="border-b border-background-icon/50 last:border-b-0"
					>
						<div class="flex items-center">
							<a
								href={notification.href ?? "#"}
								class="flex min-w-0 flex-1 gap-3 px-4 py-3 transition hover:bg-background-icon-todo/40"
								onclick={(event) => {
									event.preventDefault();
									open_notification(
										notification.id,
										notification.href,
									);
								}}
							>
								<div
									class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${get_icon_background_class(notification.type)}`}
								>
									<NotificationIcon
										size={18}
										class={get_icon_class(
											notification.type,
										)}
									/>
								</div>

								<div class="min-w-0 flex-1">
									<p
										class="text-sm font-bold leading-tight sm:text-base"
									>
										{notification.title}
									</p>

									<p
										class="mt-1 truncate text-xs text-grey sm:text-sm"
									>
										{notification.message}
									</p>
								</div>

								{#if !notification.isRead}
									<p
										class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-background-icon"
										aria-label="Notification non lue"
									></p>
								{/if}
							</a>

							<button
								type="button"
								class="px-3 text-sm text-grey transition hover:text-red"
								aria-label="Supprimer la notification"
								onclick={() =>
									delete_notification(notification.id)}
							>
								<Trash2 size={16} />
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		<!-- ======================================================
		     Complete notification page link
		     ====================================================== -->

		<a
			href="/notifications"
			class="block px-4 py-3 text-center text-sm font-bold text-red transition hover:bg-background-icon-todo/40 sm:text-base"
			onclick={close_dropdown}
		>
			Voir toutes les notifications →
		</a>
	</div>
{/if}

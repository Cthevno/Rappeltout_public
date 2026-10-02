<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import { Bell } from "@lucide/svelte";
    import { goto, invalidateAll } from "$app/navigation";
    import { onMount } from "svelte";

    let { data } = $props();

    let notifications = $derived(data.notifications);
    let error_message = $state<string | null>(null);

    /**
     * Marks all notifications as read when the history page is opened.
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

        notifications = notifications.map((notification) => ({
            ...notification,
            isRead: true,
        }));

        await invalidateAll();
    }

    onMount(() => {
        mark_all_as_read();
    });

    /**
     * Opens the destination associated with a notification.
     *
     * @param id (number) Notification identifier.
     * @param href (string | null) Destination associated with the notification.
     */
    async function openNotification(
        id: number,
        href: string | null,
    ): Promise<void> {
        error_message = null;

        const response = await fetch("/api/notifications", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        if (!response.ok) {
            error_message = "Impossible d'ouvrir cette notification.";
            return;
        }

        notifications = notifications.map((notification) =>
            notification.id === id
                ? { ...notification, isRead: true }
                : notification,
        );

        await invalidateAll();

        if (href) {
            await goto(href);
        }
    }
</script>

<main class="min-h-screen bg-background font-serif">
    <Header
        url="/home"
        text="Accueil"
        title="Notifications"
        Icon={Bell}
        notifications={data.notifications}
        unread_count={data.unreadCount}
    />

    {#if error_message}
        <p class="mx-4 mt-4 text-sm text-red md:mx-40">
            {error_message}
        </p>
    {/if}
    <div class="mx-4 my-6 flex flex-col gap-3 md:mx-40">
        {#if notifications.length === 0}
            <p class="text-center text-grey">Aucune notification.</p>
        {:else}
            {#each notifications as notification (notification.id)}
                <button
                    type="button"
                    class="w-full rounded-xl border border-grey bg-beige p-4 text-left transition hover:border-red"
                    onclick={() =>
                        openNotification(notification.id, notification.href)}
                >
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="font-bold">
                                {notification.title}
                            </p>

                            <p class="mt-1 text-sm text-grey">
                                {notification.message}
                            </p>
                        </div>

                        {#if !notification.isRead}
                            <span
                                class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red"
                                aria-label="Notification non lue"
                            ></span>
                        {/if}
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</main>

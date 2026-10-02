<script lang="ts">
    /**
     * @file SimpleHeader.svelte
     * @brief Minimal header used on the household creation/join flow (logo + invitation code).
     * @param code (string) Invitation code passed to Code.svelte.
     * @param [notifications] (NotificationData[]) Notifications of the connected user.
     * @param unread_count (number) Total number of unread notifications, shown on the bell badge and in the dropdown.
     * @see Code.svelte
     * @see Logo.svelte
     */
    import { Bell } from "@lucide/svelte";
    import NotificationDropdown from "$lib/components/NotificationDropdown.svelte";
    import Code from "$lib/components/Code.svelte";
    import Logo from "$lib/components/Logo.svelte";

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
        code,
        notifications = [],
        unread_count,
    }: {
        code: string;
        notifications?: NotificationData[];
        unread_count: number;
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
</script>

<svelte:window onclick={handle_window_click} />
<header class="bg-background-header">
    <div class=" flex items-center justify-between px-3 py-5 sm:px-4 md:px-6">
        <Logo />
        <div class="flex items-center gap-3">
            <div class="relative" bind:this={notifications_container}>
                <button
                    type="button"
                    aria-label="Afficher les notifications"
                    aria-expanded={notifications_open}
                    class="relative rounded-full p-2 text-white transition hover:bg-white/10"
                    onclick={() => (notifications_open = !notifications_open)}
                >
                    <Bell size={18} />

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

            <Code {code} />
        </div>
    </div>
</header>

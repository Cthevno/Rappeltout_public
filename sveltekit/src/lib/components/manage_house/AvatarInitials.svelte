<script lang="ts">
    /**
     * @file AvatarInitials.svelte
     * @brief Circle displaying the first two letters of a username, used as an avatar
     * @param username (string) The username whose initials are displayed
     */
    let { username }: { username: string } = $props();
</script>

<div
    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-icon-todo font-bold text-background-header"
>
    {username.slice(0, 2).toUpperCase()}
</div>

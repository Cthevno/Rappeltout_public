<script lang="ts">
    /**
     * @file ChatImg.svelte
     * @brief Renders a user avatar badge displaying initials derived from the username.
     *
     * This component computes initials from a given username and displays a rounded
     * badge with color variations depending on whether the message belongs to the current user.
     *
     * @param username (string) The username used to generate initials.
     * @param mine (boolean) Flag indicating if the message belongs to the current user.
     *
     * @returns Renders the styled avatar badge element.
     *
     * step 1 : declare component props
     *  - accept the username and ownership flag as reactive properties.
     *
     * step 2 : compute user initials
     *  - derive the first two characters of the username in uppercase.
     *
     * step 3 : render styled avatar badge
     *  - display a colored circular element containing the initials, with styles adapting to the ownership flag.
     */
    let { username, mine }: { username: string; mine: boolean } = $props();

    let initials = $derived(username.slice(0, 2).toUpperCase());
</script>

{#if mine === true}
    <p
        class="font-sans flex items-center justify-center h-8 w-8 shrink-0 rounded-full bg-background-red md:h-10 md:w-10 text-white font-bold md:text-[15px] text-[11px]"
    >
        {initials}
    </p>
{:else}
    <p
        class="font-sans flex items-center justify-center h-8 w-8 shrink-0 rounded-full bg-golden md:h-10 md:w-10 text-white font-bold md:text-[15px] text-[11px]"
    >
        {initials}
    </p>
{/if}

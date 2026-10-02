<script lang="ts">
    /**
     * @file HouseholdTabs.svelte
     * @brief Displays navigation tabs for creating or joining a household.
     * @param active_mode ("create" | "join") Currently active household mode.
     */

    type HouseholdMode = "create" | "join";

    type HouseholdTab = {
        mode: HouseholdMode;
        label: string;
        href: string;
    };

    let {
        active_mode,
    }: {
        active_mode: HouseholdMode;
    } = $props();

    /**
     * Contains the household navigation options.
     */
    const household_tabs: HouseholdTab[] = [
        {
            mode: "create",
            label: "✦ Créer un foyer",
            href: "/house/create",
        },
        {
            mode: "join",
            label: "Rejoindre un foyer",
            href: "/house/join",
        },
    ];
</script>

<nav
    aria-label="Choix de l’action du foyer"
    class="grid grid-cols-2 overflow-hidden rounded-2xl border-2 border-background-icon bg-beige"
>
    {#each household_tabs as tab (tab.mode)}
        <a
            href={tab.href}
            aria-current={active_mode === tab.mode ? "page" : undefined}
            class={`flex min-h-12 items-center justify-center px-3 py-2 text-center text-sm font-bold transition sm:px-5 sm:text-base ${
                active_mode === tab.mode
                    ? "bg-background-red text-white"
                    : "text-black hover:bg-background-icon-todo"
            }`}
        >
            {tab.label}
        </a>
    {/each}
</nav>

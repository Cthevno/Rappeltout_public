<script lang="ts">
    /**
     * @file LootManager.svelte
     * @brief Component that manage the collective and individual loot.
     * @details A guardian will be able to modifye the loots, it depends on the role of the user. HEADMASTER and TEACHER are considered as guardian.
     * @param [players] (Player[]) Array of players participating in the fight against the monster, containing their id, login, and score.
     * @param monsterId (number) The unique identifier of the currently active monster.
     * @param activeMonster (MonsterWithLoots | null) The current monster object containing its specific loots and properties, or null.
     * @param [lootType] ("COLLECTIVE" | "INDIVIDUAL") Initial loot type, defaulting to "COLLECTIVE".
     */

    import LootHeader from "./LootHeader.svelte";
    import CollectiveLootEditor from "./CollectiveLootEditor.svelte";
    import IndividualLootList from "./IndividualLootEditor.svelte";
    import { enhance } from "$app/forms";
    import type { Monster, Role } from "@prisma/client";

    type Player = { id: number; login: string; score: number, avatar: string };
    type MonsterWithLoots = Monster & {
        monsterLoots?: { id: number; userId: number; content: string }[];
        collectiveLoot?: string | null;
    };

    let {
        players = [],
        monsterId,
        activeMonster,
        lootType: propLootType = "COLLECTIVE",
        currentUser,
    }: {
        players?: Player[];
        monsterId: number;
        activeMonster: MonsterWithLoots | null;
        lootType?: "COLLECTIVE" | "INDIVIDUAL";
        currentUser: { id: number; role: Role };
    } = $props();

    let lootType = $state<"COLLECTIVE" | "INDIVIDUAL">("COLLECTIVE");
    $effect(() => {
        lootType = propLootType;
    });

    // A STUDENT is not a guardian: they cannot switch the loot type nor edit the collective loot.
    let isGardien = $derived(currentUser.role !== "STUDENT");
    let showUnauthorizedModal = $state(false);

    const INITIAL_COLLECTIVE = "Aucun butin collectif n’a été défini.";
    let collectiveLoot = $state(INITIAL_COLLECTIVE);

    $effect(() => {
        collectiveLoot = activeMonster?.collectiveLoot ?? INITIAL_COLLECTIVE;
    });

    let individualLoots = $state<Record<string, string>>({});

    $effect(() => {
        const newLoots: Record<string, string> = {};
        for (const player of players) {
            const existing = activeMonster?.monsterLoots?.find(
                (l) => l.userId === player.id,
            );
            newLoots[player.login] = existing ? existing.content : "";
        }
        individualLoots = newLoots;
    });

    function handleUnauthorized() {
        showUnauthorizedModal = true;
    }

    let formElement: HTMLFormElement;
</script>

<div class="flex flex-col gap-3 mt-3">
    <form
        bind:this={formElement}
        method="POST"
        action="?/updateLootType"
        use:enhance
        class="flex justify-center"
    >
        <input type="hidden" name="monsterId" value={monsterId} />
        <input type="hidden" name="lootType" value={lootType} />
        <LootHeader
            {lootType}
            disabled={!isGardien}
            onSelectType={(type) => {
                if (!isGardien) {
                    handleUnauthorized();
                    return;
                }
                lootType = type;
                // setTimeout is here to make sure the value of lootType is updated before updating the DB
                setTimeout(() => {
                    formElement.requestSubmit();
                }, 0);
            }}
        />
    </form>
    {#if lootType === "COLLECTIVE" && activeMonster}
        <CollectiveLootEditor
            bind:collectiveLoot
            {monsterId}
            {isGardien}
            onUnauthorizedAttempt={handleUnauthorized}
        />
    {:else}
        <IndividualLootList
            {monsterId}
            {players}
            {currentUser}
            bind:individualLoots
            {isGardien}
            onUnauthorizedAttempt={handleUnauthorized}
        />
    {/if}
</div>

<!-- Pop-up forbidden access -->
{#if showUnauthorizedModal}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
        <div
            class="bg-beige border border-golden p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center"
        >
            <h3 class="font-serif font-bold text-dark-brown text-lg">
                Accès refusé
            </h3>
            <p class="text-xs text-dark-brown leading-relaxed">
                Votre statut dans le foyer ne vous permet pas de modifier le butin.
            </p>
            <button
                onclick={() => (showUnauthorizedModal = false)}
                class="bg-background-red text-white font-serif font-bold text-xs py-2.5 px-4 rounded-xl shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
                Compris
            </button>
        </div>
    </div>
{/if}

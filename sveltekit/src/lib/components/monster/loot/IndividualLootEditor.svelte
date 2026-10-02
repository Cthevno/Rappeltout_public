<script lang="ts">
    /**
     * @file IndividualLootEditor.svelte
     * @brief Component that manage what is printed on the individual loot.
     * @details A guardian (HEADMASTER/TEACHER) can modify every player's loot. A STUDENT can only
     *          modify their own loot line, every other line stays greyed out and read-only for them.
     * @param monsterId (number) The unique identifier of the monster associated with the individual loots.
     * @param players (Player[]) Array of players participating, containing their id, login, and score.
     * @param individualLoots (Record<string, string>, bindable) Record mapping player logins to their respective individual loot strings, bound to the inputs.
     * @param isGardien (boolean) Boolean indicating whether the current user has guardian privileges to modify the individual loots.
     * @param currentUser ({id: number, role: Role}) The currently logged in user, used to know which line they own.
     * @param onUnauthorizedAttempt (function) Callback function triggered when a non-authorized user attempts to interact with an input.
     */

    import { Check } from "@lucide/svelte";
    import { enhance } from "$app/forms";
    import type { Role } from "@prisma/client";

    const MAX_LOOT_LENGTH = 60;

    type Player = { id: number; login: string; score: number; avatar: string };

    let {
        monsterId,
        players = [],
        individualLoots = $bindable(),
        isGardien,
        currentUser,
        onUnauthorizedAttempt,
    }: {
        monsterId: number;
        players: Player[];
        individualLoots: Record<string, string>;
        isGardien: boolean;
        currentUser: { id: number; role: Role };
        onUnauthorizedAttempt: () => void;
    } = $props();

    let formElement: HTMLFormElement;

    /**
     * @brief Determines whether the current user is allowed to edit a specific player's individual loot line.
     * @details Returns true if the current user has guardian privileges or if the player matches the currently logged-in user.
     * @param player (Player) The player object being evaluated for edit permissions.
     * @return (boolean) True if editing is permitted, false otherwise.
     */
    function canEditLoot(player: Player): boolean {
        return isGardien || player.id === currentUser.id;
    }

    /**
     * @brief Handles click events on an individual player's loot input field.
     * @details Checks whether the current user has permission to edit the specific player's loot.
     *          If unauthorized, it triggers the `onUnauthorizedAttempt` callback.
     * @param player (Player) The player whose loot input line was clicked.
     */
    function handleInputClick(player: Player) {
        if (!canEditLoot(player)) {
            onUnauthorizedAttempt();
        }
    }

    /**
     * @brief Converts the local individual loots record mapped by player logins into a JSON payload mapped by user IDs.
     * @details Iterates over the players array and builds a dictionary linking each player's unique user ID
     *          to their respective individual loot string content.
     * @return (string) A JSON-serialized string of the user ID-to-loot mapping payload.
     */
    function buildLootsPayload() {
        // Converts { login → content } in { userId → content }
        const payload: Record<string, string> = {};
        for (const player of players) {
            payload[player.id] = individualLoots[player.login] || "";
        }
        return JSON.stringify(payload);
    }

    let overLimitPlayers = $derived(
        players.filter(
            (player) =>
                (individualLoots[player.login]?.length ?? 0) > MAX_LOOT_LENGTH,
        ),
    );
    let hasError = $derived(overLimitPlayers.length > 0);
</script>

<form
    bind:this={formElement}
    method="POST"
    action="?/updateIndividualLoots"
    use:enhance
    class="space-y-4"
>
    <input type="hidden" name="monsterId" value={monsterId} />
    <input type="hidden" name="lootsData" value={buildLootsPayload()} />

    <div class="space-y-2">
        {#each players as player}
            {@const editable = canEditLoot(player)}
            {@const tooLong =
                (individualLoots[player.login]?.length ?? 0) > MAX_LOOT_LENGTH}
            <div class="flex items-center gap-3">
                <div
                    class="flex items-center gap-2 min-w-[100px] max-w-[100px]"
                >
                    <div
                        class="w-7 h-7 rounded-full bg-background-beige border-rounded-xl border-2 border-golden overflow-hidden shrink-0"
                    >
                        <img
                            src={player.avatar}
                            alt={player.login}
                            class="w-full h-full object-contain"
                        />
                    </div>
                    <span
                        class="font-serif text-xs truncate font-bold text-dark-brown truncate"
                        >{player.login}</span
                    >
                </div>

                <div class="flex-1 flex flex-col gap-1">
                    <div
                        role="button"
                        tabindex="0"
                        onclick={() => handleInputClick(player)}
                        onkeydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleInputClick(player);
                            }
                        }}
                        class="relative flex items-center border rounded-xl px-3 py-1.5 shadow-sm {tooLong
                            ? 'border-red-500'
                            : 'border-golden/50'} {editable
                            ? 'bg-white'
                            : 'bg-background-beige opacity-60 cursor-not-allowed'}"
                    >
                        <input
                            type="text"
                            id={`loot-${player.id}`}
                            name={`loot-${player.id}`}
                            placeholder={`Butin de ${player.login}...`}
                            bind:value={individualLoots[player.login]}
                            readonly={!editable}
                            aria-invalid={tooLong}
                            class="w-full bg-transparent text-xs md:text-sm text-dark-brown placeholder-dark-brown/40 focus:outline-none {editable
                                ? 'cursor-text'
                                : 'cursor-not-allowed'}"
                        />
                    </div>
                    {#if tooLong}
                        <p class="text-xs text-red">
                            {individualLoots[player.login]
                                .length}/{MAX_LOOT_LENGTH} caractères — trop long
                        </p>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    {#if hasError}
        <p class="text-xs text-red text-right" role="alert">
            Un ou plusieurs butins dépassent {MAX_LOOT_LENGTH} caractères. Corrigez-les
            avant d'enregistrer.
        </p>
    {/if}

    {#if isGardien || players.some((p) => p.id === currentUser.id)}
        <div class="flex justify-end pt-1">
            <button
                type="submit"
                disabled={hasError}
                class="flex items-center gap-1.5 bg-background-red hover:bg-background-red/90 text-white font-serif font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check size={14} />
                Enregistrer les butins
            </button>
        </div>
    {/if}
</form>

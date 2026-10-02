<script lang="ts">
    /**
     * @file DamageList.svelte
     * @brief Component that shows the actual score as damages of each member of the house.
     * @details Each player will be listed in descending order, showing who has the highest score so far.
     * @param [players] (Player[]) an array of Players that stores their login, score and avatar.
     */

    import { Sword } from "@lucide/svelte";
    import Badge from "$lib/components/Badge.svelte";

    type Player = {
        login: string;
        score: number;
        avatar?: string;
    };

    let { players = [] }: { players: Player[] } = $props();

    let sortedPlayers = $derived(
        [...players].sort((a, b) => b.score - a.score),
    );
</script>

<section class="flex flex-col max-w-xl mx-auto mt-8 px-4 pb-6">
    <div class="flex items-center gap-2 w-full mb-4">
        <div class="h-px flex-1 bg-golden"></div>
        <h3 class="text-center text-md text-golden truncate">
            ✦ Dégâts du foyer ✦
        </h3>
        <div class="h-px flex-1 bg-golden"></div>
    </div>

    <div class="mx-auto w-full max-w-sm flex flex-col gap-2">
        {#each sortedPlayers as player, index (player.login)}
            <div
                class="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
            >
                <div class="flex items-center gap-3 truncate">
					<Badge
						login={player.login}
						avatar={player.avatar}
					/>
                    <span
                        class="text-xs sm:text-sm font-medium truncate text-dark-brown"
                        >{player.login}</span
                    >
                </div>

                <div class="flex items-center gap-4 shrink-0">
                    <!-- Score block, aligned to the right with a fixed width -->
                    <span
                        class="w-20 text-right tabular-nums font-semibold text-dark-brown"
                    >
                        {player.score}
                    </span>

                    <!-- "Dégât(s)" text in a separate column, aligned to the left -->
                    <span
                        class="text-xs sm:text-sm font-medium text-dark-brown w-12 text-left"
                    >
                        {player.score > 1 || player.score < 0
                            ? "Dégâts"
                            : "Dégât"}
                    </span>

                    <!-- Sword icon, always aligned after the text -->
                    <Sword
                        size={18}
                        class={index === 0
                            ? "text-yellow-500"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-amber-700"
                                : "text-black"}
                    />
                </div>
            </div>
        {/each}
    </div>
</section>

<script lang="ts">
    /**
     * @file StatsManager.svelte
     * @brief Component used to print the 4 main stats of the user, Tasks, xp, monsters slayed, dmg total
     * @param tasks (number) Number of tasks completed by the user.
     * @param xpTotal (number) Total experience points accumulated by the user.
     * @param dmgTotal (number) Total damage dealt by the user.
     * @param monstersSlayed (number) Total number of monsters slayed by the user.
     */

    import { Star, Skull, Sword, Wand2 } from "@lucide/svelte";
    let {
        tasks,
        xpTotal,
        dmgTotal,
        monstersSlayed,
    }: {
        tasks: number;
        xpTotal: number;
        dmgTotal: number;
        monstersSlayed: number;
    } = $props();

    let statList = $derived([
        { label: "Tâche(s) accomplie(s)", value: tasks, icon: Wand2 },
        { label: "XP total", value: xpTotal, icon: Star },
        { label: "Dégât(s)", value: dmgTotal, icon: Sword },
        { label: "Monstre(s) vaincu(s) ", value: monstersSlayed, icon: Skull },
    ]);
</script>

<section class="mt-2 gap-4 px-4">
    <div class="flex items-center gap-4 md:mb-8 md:gap-6">
        <div class="h-px flex-1 bg-background-icon"></div>
        <h3
            class="text-xs font-semibold uppercase tracking-[0.25em] text-grey md:text-sm md:tracking-[0.35em]"
        >
            ✦ Stats ✦
        </h3>
        <div class="h-px flex-1 bg-background-icon"></div>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6">
        {#each statList as stat}
            {@const Icon = stat.icon}
            <div
                class="flex flex-col rounded-xl border-2 border-golden bg-beige shadow-sm text-center"
            >
                <p class="mt-2 mb-2 flex items-center justify-center">
                    <Icon class="w-6 h-6 text-golden" />
                </p>
                <p class="text-xl font-bold mb-2">
                    {stat.value}
                </p>
                <p class="text-xs text-grey mb-2">
                    {stat.label}
                </p>
            </div>
        {/each}
    </div>
</section>

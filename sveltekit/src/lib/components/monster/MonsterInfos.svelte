<script lang="ts">
    /**
     * @file MonsterInfos.svelte
     * @brief Component used to print the name and image of the monster. It also shows when the monster will flee.
     * @param monster (MonsterWithDetails) The active monster object containing its template details, status, and dates.
     */

    import { Clock, Trophy, Skull } from "@lucide/svelte";
    import type { Monster, MonsterTemplate, CombatLog as CombatLogEntry, User } from '@prisma/client';

    export type MonsterWithDetails = Monster & {
        template: MonsterTemplate;
        combatLogs: (CombatLogEntry & { user: User | null })[];
    };

    let {
        monster,
    }: {
        monster: MonsterWithDetails;
    } = $props();

    /**
     * @brief Formats a Date object into a French short date string (DD/MM/YY).
     *
     * @param date (Date) The date to format.
     *
     * @returns (string) The formatted date, e.g. "07/09/26".
     */
    function formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        };
        return date.toLocaleDateString("fr-FR", options);
    }
</script>

<div class="flex flex-col items-center p-4 w-full min-w-0">
    <img
        src={monster.template.imageSrc}
        alt={monster.template.name}
        class="shrink-0 w-full max-w-sm h-auto rounded-xl shadow-lg border-4 border-dark-golden"
    />
    <h2
        class="mt-4 w-full px-2 text-xl sm:text-2xl text-black text-center break-words"
    >
        {monster.template.name}
    </h2>

    {#if monster.template.lore}
        <p
            class="mt-2 w-full px-2 text-center text-sm sm:text-base italic text-grey break-words"
        >
            {monster.template.lore}
        </p>
    {/if}

    {#if monster.status === "ACTIVE" && monster.escapeDate}
        <div class="flex mt-1 italic text-grey text-xs gap-2">
            <Clock size={18} />{monster.template.name} s'enfuira le {formatDate(
                monster.escapeDate,
            )} à minuit.
        </div>
    {:else if monster.status === "FINISHED"}
        <div
            class="flex items-center mt-2 italic text-xs gap-2 {monster.killed
                ? 'text-golden'
                : 'text-red'}"
        >
            {#if monster.killed}
                <Trophy size={18} /> Vaincu {#if monster.finishedDate}
                    le {formatDate(monster.finishedDate)}{/if}
            {:else}
                <Skull size={18} /> Défaite {#if monster.finishedDate}
                    le {formatDate(monster.finishedDate)}{/if}
            {/if}
        </div>
    {/if}
</div>

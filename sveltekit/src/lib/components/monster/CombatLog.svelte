<script lang="ts">
    /**
     * @file CombatLog.svelte
     * @brief Component that shows a graphical visualisation of the damage of each player.
     * @details Each player damages/score is represented on the Y axis, and the dime is represented on the X axis.
	 * @param combatLog (CombatLogEntry[]) Array of formatted combat log entries, one per damage-dealing
     * action recorded for the currently active monster. Each entry contains the author's username (login),
     * the amount of damage dealt (dmg), and the date the damage was recorded (date, formatted "YYYY-MM-DD").
     * Used to compute cumulative damage series per player (with transformLogsToSeries) and the household's
     * total damage dealt (with houseTotalDamage), both rendered on the chart.
     */

    import { onDestroy } from "svelte";
    import Chart from "chart.js/auto";
    import {
        transformLogsToSeries,
        houseTotalDamage,
    } from "$lib/utils/functionsCombatLog";

    function getColorForIndex(index: number, total: number): string {
    const hue = (360 / total) * index;
    return `hsl(${hue}, 70%, 50%)`;
    }

    type CombatLogPoint = { date: string; total: number };
    type CombatLogSeries = Record<string, CombatLogPoint[]>;
    type CombatLogEntry = {
        login: string;
        dmg: number;
        date: string; // format "YYYY-MM-DD"
    };

    let {
        combatLog
    }: {
        combatLog: CombatLogEntry[];
    } = $props();

    let seriesByPlayer = $derived(
        transformLogsToSeries(combatLog) as CombatLogSeries,
    );
    let canvasRef: HTMLCanvasElement | undefined = $state();
    let chart: Chart | undefined;

    $effect(() => {
        if (!canvasRef) return;

        const seriesEntries = Object.entries(seriesByPlayer) as [
            string,
            CombatLogPoint[],
        ][];
        const labels = [
            ...new Set(
                seriesEntries.flatMap(([, series]) =>
                    series.map((entry) => entry.date),
                ),
            ),
        ].sort(
            (left, right) =>
                new Date(left).getTime() - new Date(right).getTime(),
        );

        if (chart) chart.destroy();

        chart = new Chart(canvasRef, {
            type: "line",
            data: {
                labels,
                datasets: seriesEntries.map(([login, series], index) => ({
                    label: login,
                    data: (() => {
                        const totalsByDate = new Map(
                            series.map((entry) => [entry.date, entry.total]),
                        );
                        let lastTotal = 0;

                        return labels.map((date) => {
                            if (totalsByDate.has(date)) {
                                lastTotal = totalsByDate.get(date) ?? lastTotal;
                            }

                            return lastTotal;
                        });
                    })(),
                    borderColor: getColorForIndex(index, seriesEntries.length),
                    backgroundColor: getColorForIndex(index, seriesEntries.length),
                    tension: 0,
                    spanGaps: true,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    });

    onDestroy(() => {
        chart?.destroy();
    });

</script>

<section class="flex flex-col max-w-xl mx-auto mt-8 px-4 pb-6">
    <div class="flex items-center gap-2 w-full mb-4">
        <div class="h-px flex-1 bg-golden"></div>
        <h3 class="text-center text-md text-golden shrink-0">
            ✦ Journal de combat ✦
        </h3>
        <div class="h-px flex-1 bg-golden"></div>
    </div>
    <div
        class="mt-6 w-full h-64 md:h-96 max-w-2xl mx-auto flex flex-col overflow-hidden rounded-3xl border-2 border-golden bg-beige p-4 shadow-sm"
    >
        <div
            class="shrink-0 mb-2 text-center text-sm italic text-gray-500 truncate"
        >
            <p> Dégâts cumulés dans le temps </p>
        </div>

        {#if Object.keys(seriesByPlayer).length === 0}
            <div
                class="flex-1 min-h-0 flex items-center justify-center text-center text-black italic"
            >
               <p> Le monstre est indemne, aucune courbe ne peut être tracée. </p>
            </div>
        {:else}
            <div class="relative flex-1 min-h-0 overflow-hidden">
                <canvas bind:this={canvasRef} class="block h-full w-full"
                ></canvas>
            </div>
        {/if}
    </div>
    <div
        class="mt-6 flex w-full max-w-2xl mx-auto items-center justify-center gap-x-3 rounded-3xl border-2 border-golden bg-beige px-4 py-2 shadow-sm"
    >
        <p class="min-w-0 truncate text-center text-lg text-black">
            Total infligé
        </p>
        <p class="shrink-0 text-lg text-red tabular-nums">
            {houseTotalDamage(combatLog)}
        </p>
    </div>
</section>

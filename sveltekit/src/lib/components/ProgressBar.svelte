<script lang="ts">
    /**
     * @file ProgressBar.svelte
     * @brief Component that shows a progress bar that can be used to show the health of a monster.
     * @details Shows remaining health points of the monster.
     * @param current (number) value that determines the current value that will fill the bar.
     * @param max (number) value that determines the maximum value that current can reach.
     * @param color (string) color of the progress bar when it's filled.
     * @param textColor (string) color of the numbers and text next to the progressBar (ex: 10/100 PV).
     * @param bgColor (string) color of the background to fill the bar when it's not fully filled.
     * @param label (string) text printed next to the numbers (ex: 10/100 PV), here, PV is the label to explain what is represented in the progressbar.
     */

    let {
        current,
        max,
        color = "bg-background-red",
        textColor = "text-background-red",
        bgColor = "bg-beige",
        label = "PV",
    }: {
        current: number;
        max: number;
        color: string;
        textColor: string;
        bgColor: string;
        label: string;
    } = $props();
    let percentage = $derived((current / max) * 100);
</script>

<div class="w-full flex flex-col gap-1">
    <div
        class="w-full {bgColor} rounded-full h-4 overflow-hidden border border-grey"
    >
        <div
            class="{color} h-full transition-all duration-500 ease-out"
            style="width: {percentage}%"
        ></div>
    </div>

    <span class="text-xs sm:text-sm font-serif font-bold {textColor} self-end">
        {current} / {max}
        {label}
    </span>
</div>

<script lang="ts">
    /**
     * @file Code.svelte
     * @brief Displays a household's invitation code.
     * @param code (string) The invitation code to display.
     * @param [text_color] (string) The color in which the code is displayed
     * @param [fill] (boolean) If true, the box expands to fill its container (e.g. next to other buttons) instead of staying at its natural size.
     */
    let {
        code,
        text_color,
        fill,
    }: { code: string; text_color?: string; fill?: boolean } = $props();
</script>

<div
    class="flex items-center justify-center rounded-xl border border-background-icon px-4 py-2 text-lg font-semibold tracking-widest text-white {fill
        ? 'h-full w-full sm:flex-1'
        : ''}"
>
    <p class={text_color}>{code}</p>
</div>

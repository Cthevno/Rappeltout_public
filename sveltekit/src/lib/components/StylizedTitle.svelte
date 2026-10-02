<script lang="ts">
    /**
     * @file StylizedTitle.svelte
     * @brief Stylized section title with a line on each side
     * @param title (string) The title text to display
     * @param [contained=true] (boolean) If false, does not apply its own max-width/centering/padding
     * (useful when the parent already constrains the width, to avoid double padding)
     */

    let { title, contained = true }: { title: string; contained?: boolean } =
        $props();
</script>

<div
    class="flex items-center gap-2 sm:gap-3 {contained
        ? 'w-full max-w-[800px] mx-auto px-4 sm:px-6'
        : ''}"
>
    <!--Line to the left-->
    <div class="h-0 min-w-4 flex-1 border-t border-settings-border"></div>

    <p
        class="min-w-0 shrink text-center text-sm text-settings-text sm:text-base"
    >
        {title}
    </p>

    <!--Line to the right-->
    <div class="h-0 min-w-4 flex-1 border-t border-settings-border"></div>
</div>

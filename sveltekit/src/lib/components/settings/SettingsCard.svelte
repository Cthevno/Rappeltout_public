<script lang="ts">
    import type { Snippet } from "svelte";
    /**
     * @file SettingsCard.svelte
     * @brief Represents the layout of the settings map.
     * @param title (string) The name of the card.
     * @param [children] (Snippet) Content rendered inside the card, below the title.
     * @param red (boolean) The boolean indicates whether the text is displayed in red (important information).
     */
    let {
        title,
        children,
        red = false,
    }: { title: string; children?: Snippet; red: boolean } = $props();
</script>

<div
    class="gap-4 text-settings-text bg-settings-bg-card border-settings-border rounded-2xl border-2 flex flex-col justify-center px-5 py-5 w-full max-w-[800px] mx-auto"
>
    <div class="flex items-center gap-3 w-full">
        <!--Line to the left-->
        <div class="flex-1 border-t border-settings-border"></div>

        {#if red}
            <p class="text-red">{title}</p>
        {:else}
            <p>{title}</p>
        {/if}

        <!--Line to the right-->
        <div class="flex-1 border-t border-settings-border"></div>
    </div>

    {@render children?.()}
</div>

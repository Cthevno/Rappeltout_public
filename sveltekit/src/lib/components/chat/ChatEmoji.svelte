<script lang="ts">
    /**
     * @file ChatEmoji.svelte
     * @brief Renders a floating emoji picker popup component.
     *
     * This component manages an interactive grid of emojis that can be appended
     * to a bound input value, with automatic popup toggling.
     *
     * @param value (string) The bound text value to append selected emojis to.
     * @param [showEmoji=false] (boolean) Bound state controlling the visibility of the emoji picker.
     *
     * @returns Renders the emoji selection popup.
     *
     * step 1 : declare component props and state
     *  - define bound values for text input and emoji picker visibility.
     *  - initialize a static array of available emojis.
     *
     * step 2 : handle emoji selection
     *  - append the chosen emoji to the bound value string.
     *  - close the emoji picker popup.
     *
     * step 3 : render emoji popup interface
     *  - display a styled floating container when `showEmoji` is true.
     *  - iterate over the emoji list to render interactive buttons with hover animations.
     */
    let {
        value = $bindable(""),
        showEmoji = $bindable(false),
    }: {
        value: string;
        showEmoji?: boolean;
    } = $props();

    const emojis = [
        "😀",
        "😂",
        "😢",
        "🔥",
        "👍",
        "❤️",
        "🎉",
        "💩",
        "✨",
        "🧹",
        "🦉",
        "🗑️",
    ];

    function addEmoji(emoji: string) {
        value += emoji;
        showEmoji = false;
    }
</script>

{#if showEmoji}
    <div
        class="absolute bottom-16 left-0 bg-settings-bg-card border-settings-border border-2 rounded-2xl w-64 z-50 w-[90vw] max-w-[280px] gap-2 text-[22px] flex flex-wrap gap-2 p-3 shadow-lg"
    >
        {#each emojis as emoji}
            <button
                type="button"
                onclick={() => addEmoji(emoji)}
                class="hover:scale-125 shrink-0"
            >
                {emoji}
            </button>
        {/each}
    </div>
{/if}

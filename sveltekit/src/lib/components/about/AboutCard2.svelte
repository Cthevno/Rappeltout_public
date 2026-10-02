<script lang="ts">
    /**
     * @file AboutCard2.svelte
     * @brief A card with an number on the left, then a title and the text.
     * @param title (string) Title of the square
     * @param text (string) Explanatory text
     * @param num (string) Stage number
     */

    let {
        title,
        text,
        num,
    }: {
        title: string;
        text: string;
        num: string;
    } = $props();
</script>

<div
    class="gap-4 text-settings-text bg-settings-bg-card border-settings-border rounded-2xl border-2 flex flex-row items-start px-6 py-6 w-full mx-auto"
>
    <div
        class="w-14 h-14 shrink-0 bg-about-bg-header rounded-2xl flex items-center justify-center"
    >
        <p class="text-golden text-[30px]">
            {num}
        </p>
    </div>

    <div class="flex-1">
        <h1 class="text-[22px] text-black font-bold">{title}</h1>
        <p class="text-[18px] font-normal leading-relaxed">{text}</p>
    </div>
</div>

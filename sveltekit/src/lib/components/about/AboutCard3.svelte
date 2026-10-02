<script lang="ts">
    /**
     * @file AboutCard3.svelte
     * @brief A card with an image on the top, then a title and the text.
     * @param title (string) Title of the square
     * @param text (string) Explanatory text
     * @param src (string) Image path
     */
    let {
        title,
        text,
        src,
    }: {
        title: string;
        text: string;
        src: string;
    } = $props();
</script>

<div
    class="gap-4 text-settings-text bg-settings-bg-card border-settings-border rounded-2xl border-2 flex flex-col justify-center items-center px-5 py-5 w-full mx-auto"
>
    <div
        class="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
    >
        <img {src} alt={title} class="w-full h-full object-contain" />
    </div>

    <h1 class="text-[22px] text-black font-bold">{title}</h1>
    <p class="text-[18px] font-normal leading-relaxed">{text}</p>
</div>

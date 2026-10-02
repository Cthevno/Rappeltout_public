<script lang="ts">
    /**
     * @file AboutCard1.svelte
     * @brief A card with an icon on the top, then a title and the text.
     * @param title (string) Title of the square
     * @param text (string) Explanatory text
     * @param Icon (Component) Icon related to the text
     * @param inprogress (boolean) futur functionality in progress
     */
    import type { Component } from "svelte";

    let {
        title,
        text,
        Icon,
        inprogress = false,
    }: {
        title: string;
        text: string;
        Icon: Component;
        inprogress?: boolean;
    } = $props();
</script>

<div
    class={`gap-4  rounded-2xl border-2 flex flex-col justify-start px-5 py-5 w-full mx-auto ${
        inprogress
            ? "border-golden bg-dark-beige text-grey cursor-not-allowed pointer-events-none"
            : "text-settings-text bg-settings-bg-card border-settings-border"
    }`}
>
    <div
        class={`w-14 h-14  rounded-2xl flex items-center justify-center ${
            inprogress
                ? "bg-background-icon-todo text-grey"
                : "bg-settings-bg-send text-golden"
        }`}
    >
        <Icon size={28} />
    </div>

    <h1
        class={`text-[22px] font-bold ${inprogress ? "text-grey" : "text-black "}`}
    >
        {title}
    </h1>
    <p
        class={`text-[18px] font-normal leading-relaxed ${inprogress ? "text-grey" : "text-black "}`}
    >
        {text}
    </p>
</div>

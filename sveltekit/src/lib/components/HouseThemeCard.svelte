<script lang="ts">
    /**
     * @file HouseThemeCard.svelte
     * @brief Displays one selectable visual house theme.
     *
     * The card keeps its house colors at all times.
     * The selected state adds a stronger border and shadow.
     */

    import type { Component } from "svelte";
    import IconifyIcon from "@iconify/svelte";

    /**
     * @brief Component properties.
     *
     * @param name (string) Display name of the house theme.
     * @param description (string) Short description displayed below the theme name.
     * @param value (string) Value associated with the theme radio button.
     * @param Icon (Component | string) Icon displayed for the house theme.
     * @param selected_value (string) Currently selected theme value.
     * This property is bindable.
     * @param color_classes (string) CSS classes defining the colors of the theme card.
     */
    let {
        name,
        description,
        value,
        Icon,
        selected_value = $bindable(),
        color_classes,
    }: {
        name: string;
        description: string;
        value: string;
        Icon: Component | string;
        selected_value?: string;
        color_classes: string;
    } = $props();

    const is_selected = $derived(selected_value === value);
</script>

<label
    class={`cursor-pointer rounded-2xl border-2 p-4 transition duration-200 hover:scale-[1.02] hover:shadow-md ${color_classes} ${
        is_selected ? "ring-2 ring-offset-2 ring-background-icon shadow-lg" : ""
    }`}
>
    <input
        type="radio"
        class="sr-only"
        name="house-theme"
        {value}
        bind:group={selected_value}
    />

    <div class="flex items-center gap-3">
        {#if typeof Icon === "string"}
            <IconifyIcon icon={Icon} width={24} height={24} />
        {:else}
            <Icon size={24} />
        {/if}

        <div>
            <h3 class="font-bold">{name}</h3>
            <p class="text-sm text-grey">{description}</p>
        </div>
    </div>
</label>

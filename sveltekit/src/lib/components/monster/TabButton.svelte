<script lang="ts">
    import type { Component } from "svelte";
    /**
     * @file TabButton.svelte
     * @brief Component used for tab buttons.
     * @details The selected button becomes red.
     * @param label (string) Text displayed on the button.
     * @param active (boolean) Indicates whether the tab is currently selected.
     * @param [onclick] ((event: MouseEvent) => void) Callback triggered on click.
     * @param [logo] (string | Component) Icon or image URL displayed inside the button.
     * @param [open_form=false] (boolean) Set to true when the button is clicked (bindable).
     * @param [disabled=false] (boolean) Disables the button and prevents onclick from firing.
     */

    let {
        label,
        active,
        onclick,
        logo,
        open_form = $bindable(false),
        disabled = false,
    }: {
        label: string;
        active: boolean;
        onclick?: (event: MouseEvent) => void;
        logo?: string | Component;
        open_form?: boolean;
        disabled?: boolean;
    } = $props();
</script>

<button
    {disabled}
    onclick={(event) => {
        onclick?.(event);
        open_form = true;
    }}
    class="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl border-2 border-golden text-[8px] sm:text-base transition-all font-serif min-w-0"
    class:opacity-40={disabled}
    class:cursor-not-allowed={disabled}
    class:bg-background-red={active}
    class:border-background-red={active}
    class:text-white={active}
    class:bg-beige={!active}
    class:border-black={!active}
    class:text-black={!active}
>
    <div class="flex items-center gap-1.5 sm:gap-2 font-serif min-w-0">
        {#if logo}
            {#if typeof logo === "string"}
                <img
                    src={logo}
                    alt=""
                    class="flex-shrink-0 w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain"
                />
            {:else}
                {@const IconComponent = logo}
                <IconComponent
                    class="flex-shrink-0 w-3.5 h-3.5 sm:w-5 sm:h-5"
                />
            {/if}
        {/if}
        <p class="break-words text-left leading-tight min-w-0">
            {label}
        </p>
    </div>
</button>

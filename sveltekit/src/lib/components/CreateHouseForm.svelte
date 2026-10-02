<script lang="ts">
    /**
     * @file CreateHouseForm.svelte
     * @brief Displays a reusable input field for the household creation form.
     * @param id (string) Unique input identifier.
     * @param label (string) Text displayed above the input.
     * @param placeholder (string) Placeholder displayed inside the input.
     * @param Icon (Component) Lucide icon displayed inside the field.
     * @param [value=""] (string) Current input value.
     * @param [type="text"] (HTMLInputAttributes["type"]) Input type.
     * @param [autocomplete="off"] (HTMLInputAttributes["autocomplete"])
     * Browser autocomplete behavior.
     * @param [required=false] (boolean) Indicates whether the field is required.
     * @param [maxlength] (number) Maximum number of characters allowed.
     */

    import type { Component } from "svelte";
    import type { HTMLInputAttributes } from "svelte/elements";

    let {
        id,
        label,
        placeholder,
        Icon,
        value = $bindable(""),
        type = "text",
        autocomplete = "off",
        required = false,
        maxlength,
    }: {
        id: string;
        label: string;
        placeholder: string;
        Icon: Component;
        value?: string;
        type?: HTMLInputAttributes["type"];
        autocomplete?: HTMLInputAttributes["autocomplete"];
        required?: boolean;
        maxlength?: number;
    } = $props();
</script>

<div class="space-y-2">
    <label for={id} class="block text-sm font-bold text-grey sm:text-base">
        {label}

        {#if required}
            <span aria-hidden="true">*</span>
            <span class="sr-only">Champ obligatoire</span>
        {/if}
    </label>

    <div
        class="flex items-center gap-3 rounded-2xl border-2 border-background-icon bg-beige px-4 transition focus-within:border-background-red focus-within:shadow-sm"
    >
        <div class="shrink-0 text-grey" aria-hidden="true">
            <Icon size={19} />
        </div>

        <input
            {id}
            name={id}
            {type}
            {placeholder}
            {autocomplete}
            {required}
            {maxlength}
            bind:value
            class="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold text-black outline-none placeholder:text-grey sm:py-3.5 sm:text-base"
        />
    </div>
</div>

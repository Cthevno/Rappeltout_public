<script lang="ts">
    import { Eye, EyeOff } from "@lucide/svelte";
    import type { Component, Snippet } from "svelte";
    /**
     * @file SettingsInfos.svelte
     * @brief Represents a piece of information, showing the name and the field for editing it.
     * @param title (string) The display text for the label.
     * @param type (string) The input type ('password', 'email').
     * @param name (string) The name variable for the input data.
     * @param [value] (string, bindable) The value of the variable for the input data.
     * @param Icon (Component) Icon, image from lucide.
     * @param [iconSize] (number) Size of the icon.
     * @param placeholder (string) The example in the box.
     * @param autocomplete (string) Explain to bowser what is the input for.
     * @param [children] (Snippet) Additional content rendered below the field.
     */
    let {
        title,
        type,
        name = "",
        value = $bindable(),
        Icon,
        iconSize = 13,
        placeholder = "",
        autocomplete = "off",
        children,
    }: {
        title: string;
        type: string;
        name?: string;
        value?: string;
        Icon: Component;
        iconSize?: number;
        placeholder?: string;
        autocomplete?: any;
        children?: Snippet;
    } = $props();

    let showPassword = $state(false);

    /**
     * @brief Determines the input type based on the password visibility state.
     * @param baseType (string) The original input type.
     * @param isVisible (boolean) Whether the password content should be visible.
     * @returns (string) "text" if the input is a visible password, otherwise the original input type.
     */
    function getPasswordType(baseType: string, isVisible: boolean) {
        if (baseType === "password" && isVisible) return "text";
        else return baseType;
    }

    let currentType = $derived(getPasswordType(type, showPassword));
</script>

<div class="gap-3 flex flex-col w-full">
    <!--INFORMATIVE TEXT-->
    <div class="flex flex-row items-center gap-1">
        <Icon size={iconSize} class="p-[3px] rounded-md text-settings-border" />
        {title}
    </div>

    <div class="relative flex items-center w-full">
        {#if type === "email"}
            <div
                class="bg-settings-bg-email border-settings-border rounded-2xl border-2 placeholder:text-settings-text/50 w-full px-4 py-2 focus:ring-2 focus:ring-black focus-ring-offset-1 outline-none"
            >
                {value}
            </div>
        {:else}
            <!--INFORMATION BOX-->
            <input
                type={currentType}
                bind:value
                {placeholder}
                {name}
                {autocomplete}
                class="border-settings-border rounded-2xl border-2 placeholder:text-settings-text/50 w-full px-4 py-2 focus:ring-2 focus:ring-black focus-ring-offset-1 outline-none"
            />
        {/if}

        {#if type === "password"}
            <!--EYE BUTTON TO SHOW PASSWORD-->
            <button
                type="button"
                class="p-[3px] rounded-md text-settings-text/50 absolute right-4"
                onclick={() => (showPassword = !showPassword)}
            >
                {#if showPassword}
                    <EyeOff size={15} />
                {:else}
                    <Eye size={15} />
                {/if}
            </button>
        {/if}
    </div>

    {@render children?.()}
</div>

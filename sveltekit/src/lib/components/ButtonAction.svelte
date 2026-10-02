<script lang="ts">
    /**
     * @file ButtonAction.svelte
     * @brief Generic action button for form submission (icon + text)
     * @param formaction (string) The form action to trigger (e.g. "?/accept")
     * @param Icon (Component) The icon to display in the button
     * @param color (string) Tailwind color/hover classes for the button
     * @param text (string) The text displayed next to the icon (hidden below sm)
     */

    import type { Component } from "svelte";

    let {
        formaction,
        Icon,
        color,
        text,
    }: { formaction: string; Icon: Component; color: string; text: string } =
        $props();
</script>

<button
    type="submit"
    {formaction}
    class="flex h-9 w-11 items-center justify-center rounded-lg {color} sm:h-auto sm:w-auto sm:gap-1 sm:px-3 sm:py-2 sm:text-sm sm:font-semibold"
>
    <Icon size={16} color="white" />
    <span class="hidden sm:inline">{text}</span>
</button>

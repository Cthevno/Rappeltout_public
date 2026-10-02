<script lang="ts">
    import type { Component } from "svelte";
    /**
     * @file ButtonRedirect.svelte
     * @brief A reusable button component for redirect.
     * @param text (string) The label text displayed on the button.
     * @param url (string) The destination path when the button is clicked.
     * @param Icon (Component) Icon, image from lucide.
     * @param style (string) CSS to customize the button
     */
    let {
        text,
        url,
        icon: Icon,
        style,
    }: {
        text: string;
        url: string;
        icon?: Component;
        style?: string;
    } = $props();
</script>

<a
    href={url}
    class=" btn-auth btn-auth-center btn-auth-border btn-auth-hover btn-auth-police gap-2 w-full {style}"
>
    {text}
    {#if Icon}
        <Icon size={15} />
    {/if}
</a>

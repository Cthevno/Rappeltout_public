<script lang="ts">
    /**
     * @file AboutLink.svelte
     * @brief Text and link pointing to the About page.
     */
</script>

<div class="py-4 flex flex-row items-center justify-center gap-4 flex-wrap">
    <a
        class="text-[14px] text-settings-text hover:underline font-sans"
        href="/about"
    >
        À propos
    </a>
    <a
        class="text-[14px] text-settings-text hover:underline font-sans"
        href="/privacy"
    >
        Confidentialité
    </a>
    <a
        class="text-[14px] text-settings-text hover:underline font-sans"
        href="/terms"
    >
        CGU
    </a>
</div>

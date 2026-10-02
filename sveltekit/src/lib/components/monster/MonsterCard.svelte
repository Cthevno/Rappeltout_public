<script lang="ts">
    /**
     * @file MonsterCard.svelte
     * @brief Component where the information related to the monster will be printed.
     * @param children (Snippet) The content or child elements rendered inside the monster card section.
     */

    let { children } = $props();
</script>

<section
    class="mt-6 bg-beige border-2 border-golden rounded-3xl p-4 sm:p-6 shadow-xl w-[calc(100%-2rem)] max-w-xl mx-auto"
>
    {@render children()}
</section>

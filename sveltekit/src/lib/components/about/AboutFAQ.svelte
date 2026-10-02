<script lang="ts">
    /**
     * @file AboutFAQ.svelte
     * @brief A card with a question on the top, then a response when the question is clicked.
     * @param question (string) Question of the FAQ
     * @param answer (string) Answer of the FAQ
     * @param isOpen (boolean) To show the answer or not
     */
    let {
        question,
        answer,
    }: {
        question: string;
        answer: string;
    } = $props();

    let isOpen = $state(false);

    /**
     * @brief A function who change the boolean.
     */
    function show() {
        isOpen = !isOpen;
    }
</script>

<div
    class="gap-4 text-settings-text bg-settings-bg-card border-settings-border rounded-2xl border-2 flex flex-col justify-center px-5 py-5 w-full mx-auto overflow-hidden"
>
    <button
        onclick={show}
        class="flex flex-row items-center cursor-pointer w-full justify-between"
    >
        <h1 class="text-[22px] text-black font-bold">{question}</h1>
        {#if !isOpen}
            <p class="text-[25px] text-golden">+</p>
        {:else}
            <p class="text-[25px] text-golden">×</p>
        {/if}
    </button>

    {#if isOpen}
        <p
            class="text-[18px] font-normal leading-relaxed pt-2 border-settings-border border-t"
        >
            {answer}
        </p>
    {/if}
</div>

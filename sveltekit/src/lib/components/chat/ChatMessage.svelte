<script lang="ts">
    import type { Component } from "svelte";
    import ChatEmoji from "./ChatEmoji.svelte";
    import { chatTest } from "../../../routes/chat/chat_validation";

    /**
     * @file ChatMessage.svelte
     * @brief Renders an interactive chat message input bar component with an emoji picker and submit action.
     *
     * This component provides a text input field, an emoji picker toggle button, and a submit button,
     * allowing users to type messages, insert emojis, and send them through a callback function.
     *
     * @param type (string) The HTML input type (e.g., text, string).
     * @param name (string) The HTML input name attribute.
     * @param Icon1 (Component) The icon component for the emoji picker toggle button.
     * @param Icon2 (Component) The icon component for the submit/send button.
     * @param [value] (string, bindable) The bound text value of the message input.
     * @param onSend (() => void) Callback function triggered upon successful form submission.
     */

    let {
        type,
        name,
        Icon1,
        Icon2,
        value = $bindable(""),
        onSend,
    }: {
        type: string;
        name: string;
        Icon1: Component;
        Icon2: Component;
        value?: string;
        onSend: () => void;
    } = $props();

    let showEmoji = $state(false);

    function handleSubmit(eventForm: SubmitEvent) {
        eventForm.preventDefault();
        if (onSend) onSend();
    }
</script>

<form
    onsubmit={handleSubmit}
    class="relative w-full max-w-[800px] mx-auto flex flex-row items-center justify-between bg-settings-bg-card border-settings-border rounded-2xl border-2 w-full max-w-[800px] px-4 py-2 gap-3"
>
    <!--EMOJI BUTTON-->
    <button
        type="button"
        onclick={() => (showEmoji = !showEmoji)}
        class="cursor-pointer hover:opacity-70 transition-opacity"
    >
        <Icon1 size={30} class="p-[3px] rounded-md text-black shrink-0" />
    </button>

    <!--EMOJI POP UP-->
    <ChatEmoji bind:value bind:showEmoji />

    <!--MESSAGE-->
    <input
        {type}
        {name}
        autocomplete="off"
        placeholder="Un message pour le foyer..."
        bind:value
        class="flex-1 border-none outline-none min-w-0"
    />

    <!--SEND BUTTON-->
    <button type="submit" class="cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" disabled={chatTest(value) !== null}>
        <Icon2
            size={30}
            color="white"
            class="p-[3px] bg-background-red rounded-md hover:opacity-90 transition-opacity"
        />
    </button>
</form>

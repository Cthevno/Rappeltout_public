<script lang="ts">
    /**
     * @file ButtonInfo.svelte
     * @brief A reusable input field component with a linked label.
     * @param text (string) The display text for the label.
     * @param option (string) The name and id used for the input (and label connection).
     * @param t (string) The input type ('text', 'password', 'email').
     * @param value (string) The bound state variable for the input data.
     * Uses $bindable, meaning the parent component can react to input changes
     * in real-time, which is essential for complex form handling.
     * * @note REJECTS / ERROR HANDLING:
     * - If 'option' is not unique, label association will break (clicking
     * the text will not focus the input).
     * - 'required' attribute relies on browser-native validation; if the input
     * is empty, the form will fail to submit before reaching any JS logic.
     */
    type InputType = "text" | "password" | "email" | "number" | "tel";

    let {
        text,
        option,
        t,
        value = $bindable(""),
    }: {
        text: string;
        option: string;
        t: InputType;
        value?: string;
    } = $props();
</script>

<div
    class="btn-auth btn-auth-info btn-auth-border btn-auth-hover btn-auth-police gap-2"
>
    <label for={option} class="cursor-pointer whitespace-nowrap">{text}</label>:

    <input
        class="bg-transparent border-none outline-none text-black w-[60%] font-sans text-[15px]"
        type={t}
        name={option}
        id={option}
        required
        bind:value
    />
</div>

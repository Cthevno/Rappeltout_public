<script lang="ts">
	import type { Component } from "svelte";
	import IconifyIcon from "@iconify/svelte";
	/**
	 * @file ButtonValidate2.svelte
	 * @brief Generic validation button for forms (submit).
	 * @details Displays a "submit" button with an icon (Lucide component or
	 * Iconify icon passed as a string) and a text. The button is visually
	 * disabled (greyed out, forbidden cursor) as long as `disabled` is true.
	 * @param text (string) The text displayed next to the icon.
	 * @param [disabled] (boolean) Disables the button and applies the corresponding style.
	 * @param [Icon] (Component | string) Icon to display: Lucide component, or Iconify icon name (string).
	 * @param formaction (string) The action to execute when the button is pressed
	 * @see CreateHouseForm.svelte for the fields associated with forms using this button
	 */
	let {
		text,
		disabled,
		Icon,
		formaction,
	}: {
		text: string;
		disabled?: boolean;
		Icon?: Component | string;
		formaction: string;
	} = $props();
</script>

<button
	type="submit"
	{formaction}
	{disabled}
	class={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white transition sm:text-base ${
		disabled
			? "cursor-not-allowed bg-background-red/45"
			: "bg-background-red hover:scale-[1.01] hover:shadow-md"
	}`}
>
	<!-- If Icon is a string, display an Iconify icon (e.g. "game-icons:owl"), otherwise a Lucide component -->
	{#if typeof Icon === "string"}
		<IconifyIcon icon={Icon} width={24} height={24} />
	{:else}
		<Icon size={18} aria-hidden="true" />
	{/if}
	<p>{text}</p>
</button>

<script lang="ts">
	/**
	 * @file InformationalMessage.svelte
	 * @brief Information box displayed above forms (e.g. household creation/joining).
	 * @details Displays an explanatory text in a styled box, with an optional icon
	 * on the left. Used notably on the house/[mode] page to guide the user according
	 * to the mode (creating or joining a household).
	 */
	import type { Component } from "svelte";

	/**
	 * @param text (string) The informational text to display.
	 * @param [Icon] (Component) Optional icon displayed to the left of the text.
	 * @note Icon is not used on every page; remove it if no page ends up using it.
	 */
	let { text, Icon }: { text: string; Icon?: Component } = $props();
</script>

<section
	class="mt-5 rounded-2xl border-2 border-background-icon bg-beige p-4 sm:mt-6 sm:p-5"
	aria-labelledby="household-creation-information"
>
	<div class="flex items-start gap-3">
		{#if Icon}
			<div
				class="mt-0.5 shrink-0 text-background-icon"
				aria-hidden="true"
			>
				<Icon size={19} />
			</div>
		{/if}
		<p
			id="household-creation-information"
			class="text-sm font-semibold leading-relaxed text-grey sm:text-base"
		>
			{text}
		</p>
	</div>
</section>

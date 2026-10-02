<script lang="ts">
	/**
	 * @file DashboardModuleCard.svelte
	 * @brief Displays a clickable dashboard module card.
	 * @details The component can display a standard card, a highlighted card,
	 * or a card with a progress bar when progress values are provided.
	 * So, this component combines the behavior of a standard module card
	 * and a progress card.
	 *
	 * @param title (string) Main title displayed on the card.
	 * @param description (string) Secondary text displayed below the title.
	 * @param href (string) Destination route when the card is clicked.
	 * @param Icon (Component) Lucide icon displayed at the top of the card.
	 * @param [active=false] (boolean) Highlights the card when set to true.
	 * @param [progress_value] (number) Current progress value.
	 * @param [progress_max] (number) Maximum progress value.
	 *
	 * @example
	 * \<DashboardModuleCard
	 *		title="Mon profil"
	 *		description="Apprentie · rang 4 · 310 / 500 XP"
	 *		href="/profile"
	 *		Icon={Star}
	 *		active={true}
	 *		progress_value={310}
	 *		progress_max={500}
	 * />
	 */
	import type { Component } from "svelte";

	let {
		title,
		description,
		href,
		Icon,
		active = false,
		progress_value,
		progress_max,
		inprogress = false,
	}: {
		title: string;
		description: string;
		href: string;
		Icon: Component;
		active?: boolean;
		progress_value?: number;
		progress_max?: number;
		inprogress?: boolean;
	} = $props();

	/**
	 * Determines whether the card has valid progress data.
	 *
	 * A progress bar is displayed only when:
	 * - progress_value is provided;
	 * - progress_max is provided;
	 * - progress_max is greater than zero.
	 *
	 * This is the logic that allows the component to behave
	 * either as a standard module card or as a progress card.
	 */
	const has_progress = $derived(
		progress_value !== undefined &&
			progress_max !== undefined &&
			progress_max > 0,
	);

	/**
	 * Converts the current progress into a percentage.
	 *
	 * Example:
	 * progress_value = 50
	 * progress_max = 100
	 * progress_percent = 50
	 *
	 * Math.max prevents values below 0%.
	 * Math.min prevents values above 100%.
	 */
	const progress_percent = $derived(
		has_progress
			? Math.max(
					0,
					Math.min((progress_value! / progress_max!) * 100, 100),
				)
			: 0,
	);
</script>

<a
	{href}
	class={`block min-h-28 rounded-2xl border-2 p-3 shadow-sm transition hover:scale-[1.02] hover:shadow-lg sm:min-h-32 sm:p-5 ${
		inprogress
			? "border-golden bg-dark-beige text-grey cursor-not-allowed pointer-events-none"
			: active
				? "border-dashboard-active bg-dashboard-active text-white"
				: "border-background-icon bg-beige text-black"
	}`}
>
	<!-- Icon -->
	<Icon
		size={18}
		class={
			inprogress
			? "mb-2 text-grey sm:mb-3"
			: active ? "mb-2 text-white sm:mb-3" : "mb-2 text-red sm:mb-3"}
	/>

	<!-- Title -->
	<h2 class="text-base font-bold leading-tight sm:text-xl">
		{title}
	</h2>

	<!-- Description -->
	<p
		class={
		inprogress
			? "mt-1 text-xs text-grey sm:text-sm"
			: active
				? "mt-1 text-xs text-background-xp sm:text-sm"
				: "mt-1 text-xs text-grey sm:text-sm"}
	>
		{description}
	</p>

	<!-- Optional progress bar -->

	<!-- 
		The progress bar is rendered only when valid 
		progress_value and progress_max values are provided. 
		This conditional section is what allows the same component 
		to replace both a standard module card and a progress card. 
	-->
	{#if has_progress}
		<div
			class="mt-3 h-2 overflow-hidden rounded-full bg-background-icon-todo"
			role="progressbar"
			aria-label={`Progression de ${title}`}
			aria-valuenow={progress_value}
			aria-valuemin="0"
			aria-valuemax={progress_max}
		>
			<div
				class="h-full rounded-full bg-background-icon"
				style={`width: ${progress_percent}%`}
			></div>
		</div>
	{/if}
</a>

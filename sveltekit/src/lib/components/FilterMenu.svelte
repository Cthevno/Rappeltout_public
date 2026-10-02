<script lang="ts">
	/**
	 * @file FilterMenu.svelte
	 * @brief Generates a list of filters from an array of filters passed as a prop.
	 * @details Delegates display and toggle behavior to ButtonFilter for each entry.
	 * @param filters ({ label: string, value?: string, stateDefault: boolean, sublabel?: string }[]) The array of filters to display.
	 * @param [name] (string) Common name of the group, passed to each ButtonFilter (radio/checkbox group).
	 * @param [multiple] (boolean) true = several filters in the group selectable (checkboxes), false/absent = only one (radio buttons).
	 * @param [onChange] (function) Function called with the `value` of the checked/selected button, passed to each ButtonFilter.
	 * @see ButtonFilter.svelte
	 * @example
	 *   const filters = [
	 *     { label: "Toutes", stateDefault: true },
	 *     { label: "Etudes", stateDefault: false },
	 *     { label: "Sport", stateDefault: false },
	 *     { label: "Démarches", stateDefault: false },
	 *   ];
	 *   \<FilterMenu filters={filters}/\>
	 */

	import ButtonFilter from "$lib/components/ButtonFilter.svelte";
	let {
		filters,
		name,
		multiple,
		onChange,
	}: {
		filters: {
			label: string;
			value?: string;
			stateDefault: boolean;
			sublabel?: string;
		}[];
		name?: string;
		multiple?: boolean;
		onChange?: (value: string) => void;
	} = $props();
</script>

<div class="flex flex-row flex-wrap gap-3 py-2">
	{#each filters as filter}
		<ButtonFilter
			stateDefault={filter.stateDefault}
			{name}
			value={filter.value}
			label={filter.label}
			sublabel={filter.sublabel}
			{multiple}
			{onChange}
		/>
	{/each}
</div>

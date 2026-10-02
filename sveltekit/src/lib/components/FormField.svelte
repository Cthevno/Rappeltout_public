<script lang="ts">
	/**
	 * @file FormField.svelte
	 * @brief Generic form field supporting three types: text, date, and filter.
	 * @details Depending on the type passed as a prop, displays a text input, a date input, or a FilterMenu.
	 * @param label (string) Label displayed above the field.
	 * @param type ("text"|"date"|"filter") Type of the field to display.
	 * @param name (string) Field name
	 * @param [placeholder] (string) Placeholder text (only for the "text" type).
	 * @param [value] (string) Pre-filled value of the field ("text" and "date" types).
	 * @param [filters] ({ label: string, stateDefault: boolean, sublabel?: string }[]) List of filters (only for the "filter" type).
	 * @param [multiple] (boolean) true to allow several filters to be selected at the same time (only for the "filter" type).
	 * @param [onValueInput] (function) Called with the new raw value on every keystroke ("text" and "date" types only).
	 * @see FilterMenu.svelte
	 */

	import FilterMenu from "$lib/components/FilterMenu.svelte";

	type Props =
		| {
				label: string;
				type: "text";
				name: string;
				placeholder?: string;
				value?: string;
				onValueInput?: (value: string) => void;
		  }
		| {
				label: string;
				type: "date";
				name: string;
				value?: string;
				onValueInput?: (value: string) => void;
		  }
		| {
				label: string;
				type: "filter";
				name: string;
				filters: {
					label: string;
					stateDefault: boolean;
					sublabel?: string;
				}[];
				multiple?: boolean;
				onValueInput?: (value: string) => void;
		  };

	const props: Props = $props();
</script>

<div>
	<p class="text-text-form mb-2">{props.label}</p>
	{#if props.type === "filter"}
		<FilterMenu
			name={props.name}
			filters={props.filters}
			multiple={props.multiple}
		/>
	{:else}
		<input
			type={props.type}
			name={props.name}
			placeholder={props.type === "text" ? props.placeholder : undefined}
			value={props.value ?? ""}
			maxlength={500}
			oninput={(e) => props.onValueInput?.(e.currentTarget.value)}
			class="text-grey border rounded-xl border-background-icon w-full px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red focus:border-red"
		/>
	{/if}
</div>

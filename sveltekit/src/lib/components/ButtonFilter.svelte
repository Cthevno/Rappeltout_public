<script lang="ts">
	/**
	 * @file ButtonFilter.svelte
	 * @brief Filter selection button.
	 * @details The button is red if active and beige otherwise.
	 * @param stateDefault (boolean) Default state (true if active, false otherwise)
	 * @param [name] (string) The name of the radio/checkbox group
	 * @param [value] (string) The value to send for this specific button
	 * @param label (string) The text displayed on the button
	 * @param [sublabel] (string) An optional text under the label (e.g. 15 XP)
	 * @param [multiple] (boolean) true = checkbox (several buttons in the group selectable), false/absent = radio button (only one).
	 * @param [onChange] (function) Function called with the button's `value` when it is checked/selected, to propagate the filter change to the parent component.
	 */

	let {
		stateDefault,
		name,
		value,
		label,
		sublabel,
		multiple,
		onChange,
	}: {
		stateDefault: boolean;
		name?: string;
		value?: string;
		label: string;
		sublabel?: string;
		multiple?: boolean;
		onChange?: (value: string) => void;
	} = $props();
</script>

<label
	class="p-2 border rounded-xl flex flex-col items-center has-[:checked]:border-red has-[:checked]:bg-red has-[:checked]:text-white border-grey bg-beige text-black"
>
	<input
		type={multiple ? "checkbox" : "radio"}
		{name}
		{value}
		checked={stateDefault}
		class="sr-only"
		onchange={() => {
			if (value !== undefined) onChange?.(value);
		}}
	/>
	{label}
	{#if sublabel}
		<p class="text-xs">{sublabel}</p>
	{/if}
</label>

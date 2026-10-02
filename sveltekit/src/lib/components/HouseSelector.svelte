<script lang="ts">
	/**
	 * @file HouseSelector.svelte
	 * @brief Modal used to select the user's visual house theme.
	 *
	 * @details
	 * The selectable house cards are rendered through
	 * the reusable HouseThemeCard component.
	 *
	 * When the user confirms a theme:
	 * - the selected theme is saved for the authenticated user
	 *   through the server API;
	 * - the theme is immediately applied to the application;
	 * - the user's household membership is not modified.
	 */

	import HouseThemeCard from "$lib/components/HouseThemeCard.svelte";

	import {
		apply_house_theme,
		DEFAULT_HOUSE_THEME,
		is_house_theme,
		type HouseTheme,
	} from "$lib/theme";

	import { ScrollText, WandSparkles, X } from "@lucide/svelte";

	// ============================================================
	// Bindable modal state
	// ============================================================

	/**
	 * @brief Component properties.
	 *
	 * @param open (boolean) Controls whether the house theme selector
	 * modal is visible. This property is bindable and defaults to false.
	 */
	let {
		open = $bindable(false),
	}: {
		open?: boolean;
	} = $props();

	// ============================================================
	// Local selection state
	// ============================================================

	/**
	 * Stores the visual theme currently selected in the modal.
	 *
	 * The value is synchronized with the radio buttons
	 * rendered inside HouseThemeCard.
	 */
	let selected_house = $state<HouseTheme>(DEFAULT_HOUSE_THEME);

	/**
	 * Prevents multiple submissions while the theme
	 * is being saved on the server.
	 */
	let is_saving = $state(false);

	// ============================================================
	// Modal synchronization
	// ============================================================

	/**
	 * Synchronizes the selected card with the theme currently
	 * applied to the root HTML element whenever the modal opens.
	 *
	 * Example:
	 *
	 * data-theme="slytherin"
	 *
	 * becomes:
	 *
	 * selected_house = "slytherin"
	 *
	 * If no valid theme is currently applied,
	 * Parchemin is used as the default value.
	 */
	$effect(() => {
		if (!open || typeof document === "undefined") {
			return;
		}

		const current_theme = document.documentElement.dataset.theme;

		selected_house = is_house_theme(current_theme)
			? (current_theme as HouseTheme)
			: DEFAULT_HOUSE_THEME;
	});

	// ============================================================
	// Modal actions
	// ============================================================

	/**
	 * @brief Closes the house selector without confirming
	 * a new selection.
	 *
	 * @return void
	 */
	function close_selector(): void {
		open = false;
	}

	/**
	 * @brief Confirms and saves the selected visual house theme.
	 *
	 * @details
	 * The selected frontend value uses lowercase names such as
	 * "slytherin".
	 *
	 * Prisma uses uppercase enum values such as "SLYTHERIN",
	 * so the value is converted before being sent to the server.
	 *
	 * The server endpoint saves the theme in the authenticated
	 * user's database record.
	 *
	 * Once the server confirms the update, the theme is applied
	 * immediately to the root HTML element.
	 *
	 * @param event (SubmitEvent) Form submission event.
	 *
	 * @return Promise resolved when the operation is complete.
	 */
	async function submit_house_selection(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (is_saving) {
			return;
		}

		is_saving = true;

		try {
			const theme_for_backend = selected_house.toUpperCase();

			const response = await fetch("/api/theme", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					theme: theme_for_backend,
				}),
			});

			if (!response.ok) {
				return;
			}

			/*
			 * Applies the newly saved theme immediately.
			 *
			 * Example result:
			 * data-theme="slytherin"
			 */
			apply_house_theme(selected_house);

			open = false;
		} catch (error) {
			return;
		} finally {
			is_saving = false;
		}
	}

	/**
	 * @brief Closes the modal when the Escape key is pressed.
	 *
	 * @param event (KeyboardEvent) Keyboard event received from the window.
	 *
	 * @return void
	 */
	function handle_keydown(event: KeyboardEvent): void {
		if (event.key === "Escape" && open) {
			close_selector();
		}
	}
</script>

<!--
    Listens for the Escape key at the browser-window level.
-->
<svelte:window onkeydown={handle_keydown} />

<!-- ============================================================
     Conditional modal rendering
     ============================================================ -->

{#if open}
	<!-- ========================================================
         Modal overlay
         ======================================================== -->

	<div
		class="fixed inset-0 z-50 overflow-y-auto px-3 py-3 sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-6"
	>
		<!--
            Clicking the overlay closes the modal.
        -->
		<button
			type="button"
			class="fixed inset-0 cursor-default bg-black/50"
			aria-label="Fermer la sélection de maison"
			onclick={close_selector}
		></button>

		<!-- ====================================================
             Main modal container
             ==================================================== -->

		<div
			class="relative z-10 mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border-2 border-background-icon bg-beige shadow-2xl sm:max-h-[90dvh] md:max-w-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="house-selector-title"
		>
			<!-- ==================================================
                 Modal header
                 ================================================== -->

			<div
				class="flex shrink-0 items-center justify-between bg-background-header px-4 py-3 text-white sm:px-6 sm:py-4"
			>
				<div class="flex items-center gap-3">
					<div
						class="rounded-lg bg-background-icon p-2 text-background-header"
					>
						<WandSparkles size={18} />
					</div>

					<h2
						id="house-selector-title"
						class="text-lg font-bold sm:text-xl md:text-2xl"
					>
						Choisir sa maison
					</h2>
				</div>

				<button
					type="button"
					aria-label="Fermer la sélection de maison"
					class="rounded-full p-2 transition hover:bg-white/10"
					onclick={close_selector}
				>
					<X size={22} />
				</button>
			</div>

			<!-- ==================================================
                 House selection form
                 ================================================== -->

			<form
				class="flex min-h-0 flex-1 flex-col"
				onsubmit={submit_house_selection}
			>
				<!-- ==============================================
                     Scrollable content area
                     ============================================== -->

				<div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
					<p
						class="mx-auto mb-4 max-w-[18rem] text-center text-xs font-semibold leading-snug text-grey sm:mb-5 sm:max-w-none sm:text-base"
					>
						« Que le Choixpeau choisisse ton destin&nbsp;! »
					</p>

					<!--
                        Every card shares selected_house through
                        two-way binding.

                        Selecting one card automatically updates
                        the currently selected theme.
                    -->
					<div class="grid gap-4 sm:grid-cols-2">
						<HouseThemeCard
							name="Parchemin"
							description="Thème neutre"
							value="parchment"
							Icon={ScrollText}
							bind:selected_value={selected_house}
							color_classes="border-[#C7A94D] bg-[#F0E2BC] text-black"
						/>

						<HouseThemeCard
							name="Gryffondor"
							description="Bravoure & noblesse"
							value="gryffindor"
							Icon={"game-icons:lion"}
							bind:selected_value={selected_house}
							color_classes="border-red-800 bg-red-100 text-red-900"
						/>

						<HouseThemeCard
							name="Serpentard"
							description="Ruse & ambition"
							value="slytherin"
							Icon={"game-icons:snake"}
							bind:selected_value={selected_house}
							color_classes="border-green-700 bg-green-100 text-green-900"
						/>

						<HouseThemeCard
							name="Serdaigle"
							description="Sagesse & esprit"
							value="ravenclaw"
							Icon={"game-icons:eagle-head"}
							bind:selected_value={selected_house}
							color_classes="border-blue-700 bg-blue-100 text-blue-900"
						/>

						<HouseThemeCard
							name="Poufsouffle"
							description="Loyauté & travail"
							value="hufflepuff"
							Icon={"game-icons:badger"}
							bind:selected_value={selected_house}
							color_classes="border-yellow-600 bg-yellow-100 text-yellow-900"
						/>
					</div>
				</div>

				<!-- ==============================================
                     Modal footer
                     ============================================== -->

				<div
					class="flex shrink-0 justify-end gap-3 border-t border-background-icon bg-beige p-4 sm:px-5 sm:py-4 md:px-6"
				>
					<button
						type="button"
						class="rounded-xl border border-background-icon px-4 py-2 transition hover:scale-[1.02] hover:bg-background-icon-todo"
						onclick={close_selector}
						disabled={is_saving}
					>
						Annuler
					</button>

					<button
						type="submit"
						class="rounded-xl bg-background-red px-4 py-2 font-bold text-white transition hover:scale-[1.02] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
						disabled={is_saving}
					>
						{is_saving ? "Enregistrement..." : "Confirmer"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

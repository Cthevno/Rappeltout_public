<script lang="ts">
    /**
     * @file LootHeader.svelte
     * @brief Component that manages the Trophy icon and the Collective and Individual Loot tab buttons.
     * @details A guardian will be able to modifye the loots
     * @param lootType (string) The current active loot type, either "COLLECTIVE" or "INDIVIDUAL".
     * @param [disabled] (boolean) When true, the tab buttons cannot be clicked at all (e.g. STUDENT role).
     * @param onSelectType (function) Callback function triggered when switching between loot types, receiving the selected type.
     */

    import { Trophy, Users, User } from "@lucide/svelte";
    import TabButton from "../TabButton.svelte";

    let {
        lootType,
        disabled = false,
        onSelectType,
    }: {
        lootType: "COLLECTIVE" | "INDIVIDUAL";
        disabled?: boolean;
        onSelectType: (type: "COLLECTIVE" | "INDIVIDUAL") => void;
    } = $props();
</script>

<div class="flex items-center justify-between gap-2 mt-2 min-w-0">
    <div
        class="flex items-center gap-1 font-serif font-bold text-dark-brown text-base shrink-0"
    >
        <Trophy
            size={18}
            class="p-[2px] bg-background-icon rounded-md shrink-0"
        />
        <p>Butin</p>
    </div>

    <div class="flex items-center gap-1 min-w-0">
        <TabButton
            label="Collectif"
            active={lootType === "COLLECTIVE"}
            onclick={() => onSelectType("COLLECTIVE")}
            logo={Users}
            {disabled}
        />
        <TabButton
            label="Individuel"
            active={lootType === "INDIVIDUAL"}
            onclick={() => onSelectType("INDIVIDUAL")}
            logo={User}
            {disabled}
        />
    </div>
</div>

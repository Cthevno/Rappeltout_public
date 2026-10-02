<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import SettingsCard from "$lib/components/settings/SettingsCard.svelte";
    import SettingsInfos from "$lib/components/settings/SettingsInfos.svelte";
    import SettingsCheck from "$lib/components/settings/SettingsCheck.svelte";
    import MsgError from "$lib/components/auth/MsgError.svelte";
    import { Settings, Mail, User, Lock, TriangleAlert } from "@lucide/svelte";
    import { enhance } from "$app/forms";
    import { settingsTest, isSettingsFormValid } from "./settings_validation";

    let {
        data,
        form,
    }: {
        data: {
            already_house: boolean;
            user?: {
                username: string;
                email: string;
                isGoogleUser: boolean;
            };
            notifications: {
                id: number;
                type: "MONSTER" | "TASK" | "XP" | "CHALLENGE" | "INVITATION";
                title: string;
                message: string;
                isRead: boolean;
                createdAt: Date;
                href: string | null;
            }[];
            unreadCount: number;
        };
        form: any;
    } = $props();
    let username = $derived(data?.user?.username);
    let email = $derived(data?.user?.email);
    let already_house = $derived(data?.already_house);
    let password: string = $state("");
    let password_new: string = $state("");
    let password_confirm: string = $state("");

    $effect(() => {
        if (form?.user?.username) username = form.user.username;
        else if (data?.user?.username) username = data.user.username;
    });

    let save: boolean = $state(false);
    let deleteConfirm: boolean = $state(false);

    let errorMsg = $derived(
        settingsTest(username, password, password_new, password_confirm),
    );
</script>

<div class="font-serif m-0 min-h-screen bg-background flex flex-col gap-6">
    <!--HEADER-->
    {#if already_house}
        <Header
            url="/home"
            text="Accueil"
            title="Paramètres du compte"
            Icon={Settings}
            right="nothing"
            notifications={data.notifications}
            unread_count={data.unreadCount}
        />
    {:else}
        <Header
            url="/house/create"
            text="Créer/Rejoindre"
            title="Paramètres du compte"
            Icon={Settings}
            right="nothing"
            notifications={data.notifications}
            unread_count={data.unreadCount}
        />
    {/if}
    <form
        method="POST"
        use:enhance
        class="flex flex-col gap-6 w-full pb-16 px-4"
    >
        <!--IDENTIFIER-->
        <SettingsCard title="♦ IDENTIFIANTS ♦" red={false}>
            <!--e-mail-->
            <SettingsInfos
                title="ADRESSE E-MAIL"
                type="email"
                name="email"
                bind:value={email}
                Icon={Mail}
                iconSize={22}
                placeholder=""
            />

            <!--Username-->
            <SettingsInfos
                title="PSEUDO"
                type="text"
                name="username"
                bind:value={username}
                Icon={User}
                iconSize={22}
                placeholder=""
                autocomplete="username"
            />
            {#if form?.errorUsername}
                <MsgError text={form?.errorUsername} />
            {/if}

            <p class="text-left text-settings-text">
                Utilisé pour te connecter à Rappeltout.
            </p>
        </SettingsCard>

        {#if !data?.user?.isGoogleUser}
            <!--PASSWORD-->
            <SettingsCard title="♦ MOT DE PASSE ♦" red={false}>
                <!--Current password-->
                <SettingsInfos
                    title="MOT DE PASSE ACTUEL"
                    type="password"
                    name="password"
                    bind:value={password}
                    Icon={Lock}
                    iconSize={22}
                    placeholder="********"
                    autocomplete="password"
                />

                <!--New password-->
                <SettingsInfos
                    title="NOUVEAU MOT DE PASSE"
                    type="password"
                    name="new_password"
                    bind:value={password_new}
                    Icon={Lock}
                    iconSize={22}
                    placeholder="********"
                    autocomplete="new_password"
                >
                    <p class="font-semibold text-settings-text">
                        8 caractères minimum.
                    </p>
                </SettingsInfos>

                <!--Confirm password-->
                <SettingsInfos
                    title="CONFIRMER LE NOUVEAU MOT DE PASSE"
                    type="password"
                    name="password_confirm"
                    bind:value={password_confirm}
                    Icon={Lock}
                    iconSize={22}
                    placeholder="********"
                    autocomplete="password_confirm"
                />

                {#if form?.errorPassword}
                    <MsgError text={form?.errorPassword} />
                {/if}
            </SettingsCard>
        {/if}

        <!--MESSAGE VALIDATION OF CHANGES-->
        {#if form?.success}
            <SettingsCheck text="Modifications enregistrées." />
        {/if}

        <!--SAVE BUTTON-->
        <button
            formaction="?/updateInfos"
            type="submit"
            onclick={() => {
                save = !save;
                setTimeout(() => (save = false), 4000);
            }}
            class="cursor-pointer text-white text-sm text-[20px] font-semibold bg-settings-bg-save hover:opacity-90 active:scale-[0.98] rounded-2xl w-full mx-auto py-3 transition-all max-w-[800px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isSettingsFormValid(username ?? "", password, password_new, password_confirm, data?.user?.isGoogleUser ?? false)}
        >
            Enregistrer les modifications
        </button>
        <div class="flex items-center justify-center">
            {#if form?.errorChanged}
                <MsgError text={form?.errorChanged} />
            {:else}
                <MsgError text={errorMsg} />
            {/if}
        </div>
    </form>

    <form method="POST" class="flex flex-col gap-6 w-full pb-16 px-4">
        <!--DELETE-->
        <SettingsCard title="♦ SUPPRESSION DU COMPTE ♦" red={true}>
            {#if !deleteConfirm}
                <p class="text-left text-black">
                    Cette action est irréversible !
                </p>

                <button
                    type="button"
                    onclick={() => (deleteConfirm = true)}
                    class="cursor-pointer text-red text-[20px] bg-settings-bg-send hover:bg-settings-bg-hover-send border-2 border-settings-border rounded-2xl w-full max-w-[800px] mx-auto py-5 gap-2 flex items-center justify-center"
                >
                    <TriangleAlert size={22} />
                    Supprimer le compte
                </button>
            {:else}
                <p class="text-black">
                    Es-tu sûr de vouloir supprimer ton compte ?
                </p>
                <button
                    type="submit"
                    formaction="?/deleteAccount"
                    class="cursor-pointer text-black text-[15px] bg-settings-bg-send hover:bg-settings-bg-hover-send border-2 border-settings-border rounded-2xl w-full max-w-[800px] mx-auto py-3 gap-2 flex items-center justify-center"
                >
                    Oui supprimer pour toujours !
                </button>

                <button
                    type="button"
                    onclick={() => (deleteConfirm = false)}
                    class="cursor-pointer text-black text-[15px] bg-settings-bg-send hover:bg-settings-bg-hover-send border-2 border-settings-border rounded-2xl w-full max-w-[800px] mx-auto py-3 gap-2 flex items-center justify-center"
                >
                    Annuler !
                </button>
            {/if}

            {#if form?.error}
                <MsgError text={form?.error} />
            {/if}
        </SettingsCard>
    </form>
</div>

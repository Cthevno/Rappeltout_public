<script lang="ts">
    /**
     * @file ErrorPage.svelte
     * @param [status] (number) The code error to print, 404 by default
     */
    import ButtonRedirect from "$lib/components/auth/ButtonRedirect.svelte";
    import { Undo2 } from "@lucide/svelte";

    let {status = 404} : {status? : number} = $props();

</script>

<div class="flex flex-col items-center justify-center min-h-screen gap-6 max-w-md mx-auto text-center">
    <p class="text-red font-bold md:text-[40px] text-[30px]">Error {status}</p>
    <h1 class = "text-red font-bold md:text-[20px] text-[10px]">Tu es perdu ?</h1>
    <p class="md:text-[14px] text-[7px] px-10">On dirait que tu t'es égaré en chemin. Tu sais ce qui peut aider quand on perd le fil ? Un bon vieux Rappeltout bien configuré pour ne plus jamais oublier où tu vas.</p>
    <p class="font-bold md:text-[14px] text-[7px] px-10">Tu cherches à retrouver ton chemin vers la civilisation ? Ceci t'intéressera peut-être :</p>

    <ButtonRedirect text="Retour" url="/auth/welcome" icon={Undo2}/>

</div>

<script lang="ts">
	import type { PageProps } from './$types';
	import Input from '$lib/components/processes/input.svelte';

	let { data }: PageProps = $props();

  const inputs: JSON = data.inputs;
  const outputs: JSON = data.outputs;

  let bbox = $state();
  let active = $state(true);

  let resolution;
  let sea_level_rise;


  function submit() {

  }
</script>

{#snippet render(name: string, input: JSON)}
  {#if input?.schema?.type == "integer"}
    <input class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]" id="{name}" name="{name}" type="number" min={input?.schema?.minimum} max={input?.schema?.maximum} value={input?.schema?.default}>
  {:else if input?.schema?.type == "number"}
    <input class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]" id="{name}" name="{name}" type="number" min={input?.schema?.minimum} max={input?.schema?.maximum} value={input?.schema?.default}>
  {:else if input?.schema?.type == "object"}
    {#if input?.schema?.format == "ogc-bbox"}
      <BoundingBox coordinatesId={data.id} bind:active="{active}" bind:this="{bbox}" />
    {/if}
  {/if}
{/snippet}

<style>
  input {
    border: 1px solid black;
  }
</style>

<h1>{data.title}</h1>
<h2>{data.description}</h2>

<h3 class="font-custom-style-h2">Inputs</h3>
<div class="space-y-[1.125rem]">
  {#each Object.keys(inputs) as input}
    <Input name={input} definition={inputs[input]}/>
    <!-- <h4 class="font-custom-style-h3">{inputs[input].title} ({input})</h4> -->
    <!-- <p>{inputs[input].description}</p> -->
    <!-- <div>{@render render(input, inputs[input])}</div> -->
  {/each}
</div>

<h3 class="font-custom-style-h2">Outputs</h3>
<div class="space-y-[1.125rem]">
  {#each Object.keys(outputs) as output}
    <h4>{outputs[output].title} ({output})</h4>
    <p>{outputs[output].description}</p>
  {/each}
</div>

<button class="w-full md:w-auto justify-self-end button-5 h-12 md:h-auto shadow-[0rem_0.1875rem_0.375rem_#00000029]" onclick={submit}>Submit</button>

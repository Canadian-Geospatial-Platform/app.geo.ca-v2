<script lang="ts">
    import BoundingBox from '$lib/components/search-results/filters/bounding-box.svelte';

    interface Props {
        name: string;
        definition: JSON;
    }

    let {
        name,
        definition
    }: Props = $props();

    const type = definition?.schema?.type;
    const format = definition?.schema.format;

    const min = definition?.schema?.minimum;
    const max = definition?.schema?.maximum;
    const defalt = definition?.schema?.default;

    const styleClass = "border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]";
</script>

{#snippet render()} 
  {#if definition?.schema?.enum}
    <select id="{name}" name="{name}" class={styleClass}>
      {#each definition?.schema?.enum as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  {:else if type == "string"}
    <input class={styleClass} id="{name}" name="{name}" type="text" value={defalt}>
  {:else if type == "integer" || type == "number"}
    <input class={styleClass} id="{name}" name="{name}" type="number" min={min} max={max} value={defalt}>
  {:else if type == "object"}
    {#if format == "ogc-bbox"}
      <BoundingBox coordinatesId={name} active={true} bind:this={bbox} />
    {/if}
  {/if}
{/snippet}

<div class="space-y-[1.125rem]">
    <h4 class="font-custom-style-h3">{definition.title} ({name})</h4>
    <p>{definition.description}</p>
    <div>{@render render()}</div>
  </div>
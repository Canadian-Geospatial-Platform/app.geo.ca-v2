<script lang="ts">
    import BoundingBox from '$lib/components/search-results/filters/bounding-box.svelte';

    interface Props {
        name: string;
        definition: JSON;
        value: any;
    }

    let {
        name,
        definition,
        value = $bindable()
    }: Props = $props();

    const type = definition?.schema?.type;
    const format = definition?.schema.format;

    const min = definition?.schema?.minimum;
    const max = definition?.schema?.maximum;
    const defalt = definition?.schema?.default;

    value = defalt;

    let input = $state();

    export function getValue() {
      if (type == "object") {
        if (format == "ogc-bbox") {
          let bbox = input.getBBox();
          return {bbox: [bbox.west, bbox.south, bbox.east, bbox.north]};
        }
      } else {
        return value;
      }
    }

    const styleClass = "border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]";

    export function reset() {
      if (type == "object") {
        if (format == "ogc-bbox") {
          // TODO: handle a default geom value?
          input.resetFilters();
        }
      } else if (definition?.schema?.enum) {
        if (defalt != null) {
          input.value = defalt;
        } else {
          input.options.selectedIndex = 0;
        }
      } else if (type == "string" || type == "integer" || type == "number") {
        input.value = defalt == null ? '' : defalt;
      }
    }
</script>


{#snippet render()}
  {#if definition?.schema?.enum}
    <select id="{name}" name="{name}" class={styleClass} bind:this={input} bind:value={value}>
      {#each definition?.schema?.enum as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  {:else if type == "string"}
    <input class={styleClass} id="{name}" name="{name}" type="text" bind:this={input} bind:value={value}>
  {:else if type == "integer" || type == "number"}
    <input class={styleClass} id="{name}" name="{name}" type="number" min={min} max={max} bind:this={input} bind:value={()=>{return value;}, (v) => {value = v;}}>
  {:else if type == "object"}
    {#if format == "ogc-bbox"}
      <BoundingBox coordinatesId={name} active={true} bind:this={input} />
    {/if}
  {:else}
    <p>Type: {type}</p>
  {/if}
{/snippet}

<div class="flex flex-col gap-2 font-open-sans px-5 md:px-0">
  <h4 class="font-custom-style-h3">{definition.title} ({name})</h4>
  <p>{definition.description}</p>
  <div>{@render render()}</div>
</div>
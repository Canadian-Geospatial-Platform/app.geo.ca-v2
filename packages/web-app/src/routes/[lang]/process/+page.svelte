<script lang="ts">
	import type { PageProps } from './$types';
	import Input from '$lib/components/processes/input.svelte';
  import ProcessModal from '$lib/components/processes/process-modal.svelte';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';

	let { data }: PageProps = $props();

  const process = data.svcDef;

  const inputs: object = process.inputs;
  const outputs: object = process.outputs;

  const t = data.t;

  let executionLink: string = "";
  for (let element of process.links) {
    if (element.rel == "http://www.opengis.net/def/rel/ogc/1.0/execute") {
      executionLink = element.href;
      break;
    }
  };

  let selectedOutput = $state(Object.keys(outputs)[0]);

  let bbox = $state();
  let active = $state(true);

  let inputElements = $state({});

  let statusModal = $state();
  let modalActive: boolean = $state(false);
  let statusJson: object = $state({})

  function submit() {
    modalActive = true;
    toggleScroll(true);

    const request = {
      inputs: {},
      outputs: {},
      response: "raw"
    };

    let keys = Object.keys(inputs);
    for (let i = 0; i < keys.length; i++) {
      request.inputs[keys[i]] = inputElements[keys[i]].getValue();
    }

    request.outputs = {};
    request.outputs[selectedOutput] = {
      transmissionMode: "value",
      format: `${outputs[selectedOutput].schema.contentMediaType}`
    };

    statusModal.execute(request, executionLink);
  }

  function resetAll() {
    for (let inputElement in inputElements) {
      inputElements[inputElement].reset();
    }
  }

</script>

<div class="flex flex-col gap-4">
  <h1 class="font-custom-style-h1  px-5 md:px-0">{process.title}</h1>
  <h4 class="px-5 md:px-0">{process.description}</h4>

  <h2 class="font-custom-style-h2 px-5 md:px-0">{t["input"]}</h2>
  <div class="relative flex flex-col gap-4 mb-2 mt-[-0.75em] font-open-sans">
    {#each Object.keys(inputs) as input}
      <Input name={input} definition={inputs[input]} bind:this={inputElements[input]}/>
    {/each}
  </div>

  <h2 class="font-custom-style-h2 px-5 md:px-0">{t["output"]}</h2>
  <div class="relative flex flex-col gap-4 mb-2 mt-[-0.75em] font-open-sans px-5 md:px-0">
    {#each Object.keys(outputs) as output}
      <!-- <div class="flex flex-col gap-2 font-open-sans px-5 md:px-0"> -->
      <div>
        <input type="radio" id="{output}" value="{output}" name="output" bind:group={selectedOutput}>
        <label for="{output}" style="font-weight: 600;">{outputs[output].title} ({output})</label>
        <p>{outputs[output].description}</p>
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 col-span-6 bg-custom-5 md:border-t border-custom-21 px-5 py-7 md:py-[1.125rem] gap-y-8" >
      <button type="button" class="row-start-2 md:row-start-1 w-full md:w-auto justify-self-start button-3 h-12 md:h-auto" onclick={resetAll} >{t["reset"]}</button>
      <button class="w-full md:w-auto justify-self-end button-5 h-12 md:h-auto shadow-[0rem_0.1875rem_0.375rem_#00000029]" onclick={submit}>{t["submit"]}</button>
  </div>

</div>
<ProcessModal t={t} bind:active={modalActive} bind:statusJson={statusJson} bind:this={statusModal} />

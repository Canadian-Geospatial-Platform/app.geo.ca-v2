<script lang="ts">
  import Legal from './legal.svelte';
  import Links from './links.svelte';
  import Upper from './upper.svelte';

  export let linksData: JSON;
  export let legalData: {[key: string]: string};

</script>

<div>
  <Upper />
  <Links linksData={linksData} />
  <Legal legalData={legalData} />
</div>
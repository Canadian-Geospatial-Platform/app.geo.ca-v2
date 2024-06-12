<script lang="ts">
  import Legal from './legal.svelte';
  import Links from './links.svelte';

  export let linksData: JSON;
  export let legalData: {[key: string]: string};

</script>

<div>
  <Links linksData={linksData} />
  <Legal legalData={legalData} />
</div>
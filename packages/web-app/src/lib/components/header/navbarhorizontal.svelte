<script>
	import { page } from '$app/stores';
  import Navitem from './navitem.svelte';

  const navItems = $page.data.navitems;
  const orientation = 'horizontal';
</script>

<div class="flex justify-end space-x-8 items-end">
  {#each Object.entries(navItems) as [colIndex, data]}
    <Navitem linkData={data} {orientation} />
  {/each}
</div>

<style></style>
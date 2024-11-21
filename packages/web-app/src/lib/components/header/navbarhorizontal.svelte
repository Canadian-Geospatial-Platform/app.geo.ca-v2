<script>
	import { page } from '$app/stores';
  import Navitem from './navitem.svelte';

  const userId = $page.data.userData?.uuid;
  const navItems = $page.data.navitems;
  const orientation = 'horizontal';
</script>

<div class="flex justify-end space-x-8 items-end">
  {#each Object.entries(navItems) as [colId, data]}
    {#if (colId != 'collections') || userId}
      <Navitem linkData={data} {orientation} />
    {/if}
  {/each}
</div>

<style></style>
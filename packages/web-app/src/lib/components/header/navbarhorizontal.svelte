<script>
  import { page } from '$app/state';
  import Navitem from './navitem.svelte';

  let navItems = $derived(page.data.navitems);
  const orientation = 'horizontal';
</script>

<nav class="flex justify-end space-x-8 items-end">
  {#each Object.entries(navItems) as [colId, data] (colId)}
    <Navitem linkData={data} {orientation} dropDownClick={() => {}} />
  {/each}
</nav>

<style></style>

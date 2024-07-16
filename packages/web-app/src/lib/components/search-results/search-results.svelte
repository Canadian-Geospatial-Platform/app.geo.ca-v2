<script lang="ts">
  import { page } from '$app/stores';
	import ResultList from '$lib/components/search-results/result-list.svelte';

  /************* Translations ***************/
  const translations = $page.data.t;

  const listViewText = translations?.listView ? translations["listView"] : "List View";
</script>

<h2 class="font-custom-style-h2">
  {listViewText}
</h2>
<ResultList />

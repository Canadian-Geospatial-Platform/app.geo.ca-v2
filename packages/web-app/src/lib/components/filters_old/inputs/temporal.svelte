<script lang="ts">
	import { page } from '$app/stores';
	export let id;
	export let name;

	function init(key) {
		return $page.url.searchParams.get(key);
	}
</script>

<label for={id}>{name}:</label>
<input type="date" {id} name={id} value={init(id)} />

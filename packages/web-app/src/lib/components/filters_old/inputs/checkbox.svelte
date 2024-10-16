<script lang="ts">
	import { page } from '$app/stores';
	export let id;
	export let name;

	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}
</script>

<input checked={init(id)} type="checkbox" {id} name={id} />
<label for={id}>{name}</label>

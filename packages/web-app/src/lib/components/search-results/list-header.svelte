<script lang="ts">
	// This component is a header bar with search result information, ordering options and presentation options.
	let total = 0; // the total number of search results
	let start = 0; // the offset of search results
	let end = 0; // the limit of search results
</script>

<div>
	<p>
		{start} - {end} of {total} datasets
	</p>
</div>

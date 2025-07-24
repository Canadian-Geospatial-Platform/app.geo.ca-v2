<svelte:head>
	<!-- Google Tag Manager -->
	{#if import.meta.env.VITE_STAGE == 'staging'}
		<script>
			(function (w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
				var f = d.getElementsByTagName(s)[0],
					j = d.createElement(s),
					dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore(j, f);
			})(window, document, 'script', 'dataLayer', 'GTM-MK9H4CK');
		</script>
	{:else if import.meta.env.VITE_STAGE == 'production'}
		<script>
			(function (w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
				var f = d.getElementsByTagName(s)[0],
					j = d.createElement(s),
					dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore(j, f);
			})(window, document, 'script', 'dataLayer', 'GTM-KG9WWH6');
		</script>
	{/if}
	<!-- End Google Tag Manager -->
</svelte:head>

<!-- Google Tag Manager (noscript) -->
{#if import.meta.env.VITE_STAGE == 'staging'}
	<noscript
		><iframe
			title="Google Tag"
			src="https://www.googletagmanager.com/ns.html?id=GTM-MK9H4CK"
			height="0"
			width="0"
			style="display:none;visibility:hidden"
		></iframe></noscript
	>
{:else if import.meta.env.VITE_STAGE == 'production'}
	<noscript
		><iframe
			title="Google Tag"
			src="https://www.googletagmanager.com/ns.html?id=GTM-KG9WWH6"
			height="0"
			width="0"
			style="display:none;visibility:hidden"
		></iframe></noscript
	>
{/if}
<!-- End Google Tag Manager (noscript) -->

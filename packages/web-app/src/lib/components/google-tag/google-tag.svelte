<svelte:head>
  <!-- Google Tag Manager -->
  {#if import.meta.env.VITE_STAGE === 'staging'}
    <script>
      (function (window, document, scriptTagName, dataLayerName, gtmId) {
        window[dataLayerName] = window[dataLayerName] || [];
        window[dataLayerName].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var firstScript = document.getElementsByTagName(scriptTagName)[0],
          newScript = document.createElement(scriptTagName),
          dataLayerParam = dataLayerName !== 'dataLayer' ? '&l=' + dataLayerName : '';
        newScript.async = true;
        newScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId + dataLayerParam;
        firstScript.parentNode.insertBefore(newScript, firstScript);
      })(window, document, 'script', 'dataLayer', 'GTM-MK9H4CK');
    </script>
  {:else if import.meta.env.VITE_STAGE === 'production'}
    <script>
      (function (window, document, scriptTagName, dataLayerName, gtmId) {
        window[dataLayerName] = window[dataLayerName] || [];
        window[dataLayerName].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var firstScript = document.getElementsByTagName(scriptTagName)[0],
          newScript = document.createElement(scriptTagName),
          dataLayerParam = dataLayerName !== 'dataLayer' ? '&l=' + dataLayerName : '';
        newScript.async = true;
        newScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId + dataLayerParam;
        firstScript.parentNode.insertBefore(newScript, firstScript);
      })(window, document, 'script', 'dataLayer', 'GTM-KG9WWH6');
    </script>
  {/if}
  <!-- End Google Tag Manager -->
</svelte:head>

<!-- Google Tag Manager (noscript) -->
{#if import.meta.env.VITE_STAGE === 'staging'}
  <noscript
    ><iframe
      title="Google Tag"
      src="https://www.googletagmanager.com/ns.html?id=GTM-MK9H4CK"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe></noscript
  >
{:else if import.meta.env.VITE_STAGE === 'production'}
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

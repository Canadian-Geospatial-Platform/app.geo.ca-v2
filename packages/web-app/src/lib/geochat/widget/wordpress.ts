import { mount } from 'svelte';
import WordPressWidget from './wordpress-widget.svelte';
import { setGeoChatConfig } from '$lib/geochat/geochat-config';
import { getWordPressConfig } from '$lib/geochat/widget/wordpress-utils';

// Load API endpoints and settings injected by the WordPress plugin.
setGeoChatConfig(getWordPressConfig());

function init() {
  const target = document.getElementById('geochat-root');

  /* In WordPress/Elementor the footer container may be rendered
   * after the script executes, so retry until geochat-root exists. */

  if (!target) {
    console.log('geochat-root not found, retrying...');
    setTimeout(init, 100);
    return;
  }

  console.log('mounting geochat');

  mount(WordPressWidget, {
    target,
  });
}

init();

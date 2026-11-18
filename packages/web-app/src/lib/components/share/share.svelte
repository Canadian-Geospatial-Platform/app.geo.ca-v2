<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import Email from '#lib/components/icons/email.svelte';
  import Facebook from '#lib/components/icons/facebook.svelte';
  import Linkedin from '#lib/components/icons/linkedin.svelte';
  import X from '#lib/components/icons/x.svelte';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  // Note: these variables need to be computed to react to changes to the page's url
  let path = $derived(page.url.href);
  let encodedPath = $derived(encodeURIComponent(String(path)));

  /**
   * Handles the Facebook share link.
   */
  function handleFacebookLink(): void {
    let facebookLink = 'https://www.facebook.com/sharer/sharer.php';
    let fbShareLink = `${facebookLink}?u=${encodedPath}`;
    window.open(fbShareLink);
  }

  /**
   * Handles the X share link.
   */
  function handleXLink(): void {
    let xLink = 'https://x.com/intent/post';
    let xShareLink = `${xLink}?url=${encodedPath}`;
    window.open(xShareLink);
  }

  /**
   * Handles the LinkedIn share link.
   */
  function handleLinkedInLink(): void {
    let linkedInLink = 'https://linkedin.com/shareArticle';
    let linkedInShareLink = `${linkedInLink}?url=${encodedPath}&mini=true`;
    window.open(linkedInShareLink);
  }

  /**
   * Handles the email share link.
   */
  function handleEmailLink(): void {
    let mailToLink = 'mailto:?body=' + encodeURIComponent(path);
    window.open(mailToLink);
  }
</script>

<div class="flex flex-wrap items-center justify-start">
  <h1 class="font-custom-style-body-1 mr-3 w-full md:w-fit text-left mb-2 md:mb-0">
    {translations.components.share.labels.shareText}
  </h1>
  <button aria-label={translations.components.share.labels.facebook} onclick={handleFacebookLink}>
    <Facebook />
  </button>
  <button aria-label={translations.components.share.labels.x} onclick={handleXLink}>
    <X />
  </button>
  <button aria-label={translations.components.share.labels.linkedIn} onclick={handleLinkedInLink}>
    <Linkedin />
  </button>
  <button aria-label={translations.components.share.labels.email} onclick={handleEmailLink}>
    <Email />
  </button>
</div>

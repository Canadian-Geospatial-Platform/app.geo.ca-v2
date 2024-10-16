<script lang="ts">
  import { page } from '$app/stores';
  import Email from "$lib/components/icons/email.svelte";
  import Facebook from "$lib/components/icons/facebook.svelte";
  import Linkedin from "$lib/components/icons/linkedin.svelte";
  import X from "$lib/components/icons/x.svelte";

  const translations = $page.data.shareTranslations;
  let shareText = Object.hasOwn(translations,"shareText") ? translations["shareText"] : "Share";
  let path = $page.url;
  let encodedPath = encodeURIComponent(String(path));
  let iconClass = "m-2 h-12 w-12";

  function handleFacebookLink() {
    let facebookLink = "https://www.facebook.com/sharer/sharer.php";
    let fbShareLink = facebookLink + "?u=" + encodedPath;
    window.open(fbShareLink);
  };

  function handleXLink() {
    let xLink = "https://x.com/intent/post";
    let xShareLink = xLink + "?url=" + encodedPath;
    window.open(xShareLink);
  };

  function handleLinkedInLink() {
    let linkedInLink = "https://linkedin.com/shareArticle";
    let linkedInShareLink = linkedInLink + "?url=" + encodedPath + "&mini=true";
    window.open(linkedInShareLink);
  };

  function handleEmailLink() {
    let mailToLink = "mailto:?body=" + path;
    window.open(mailToLink);
  };
</script>

<div class="flex flex-wrap items-center justify-center md:justify-start">
  <h1 class="font-custom-style-body-1 mr-3 w-full md:w-fit text-center md:text-left">
    {shareText}
  </h1>
  <button aria-label="facebook" on:click={handleFacebookLink}>
    <Facebook classes={iconClass}/>
  </button>
  <button aria-label="X" on:click={handleXLink}>
    <X classes={iconClass}/>
  </button>
  <button aria-label="LinkedIn" on:click={handleLinkedInLink}>
    <Linkedin classes={iconClass}/>
  </button>
  <button aria-label="email/courriel" on:click={handleEmailLink}>
    <Email classes={iconClass}/>
  </button>
</div>

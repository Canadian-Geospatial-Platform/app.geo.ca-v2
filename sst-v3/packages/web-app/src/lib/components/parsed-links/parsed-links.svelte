<script lang="ts">
  /*****************************************************************************
   *  Note: A regular expression is used to parse all url values in the provided
   *  text, so this string can be anything, including a full paragraph.
   *  The returned component will be the full original text, but with each url
   *  replaced with an anchor component
   *****************************************************************************/
  export let linkText;

  let urlRegEx = /(https?:\/\/[^\s|)]+)/g;
  let anchoredLinkText = linkText.replaceAll(
    urlRegEx, ((x: string) => '<a href="' + x
    + '" target="_blank" class="underline decoration-from-font text-custom-16">'
    + x + '</a>')
  );
</script>

{@html anchoredLinkText}
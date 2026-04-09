/**
 * Returns the original text string but with html formatting for links and markdown.
 *
 * Note: requires @html on the client side to properly display any html.
 *
 * @param text - The text to parse and format.
 * @returns The formatted text with HTML.
 */
export const parseText = function (text: string): string {
  // Replace new line characters with html equivalent
  text = text.replaceAll(/\\n/g, '<br>');

  /*****************************************************************************
   * Sometimes markdown formatting is used to style text. This needs to be
   * converted to html. We can catch some of the basics using
   * regular expressions
   *****************************************************************************/

  /****** Bold & Italic ******/
  text = text.replaceAll(/\*\*\*(.+?)\*\*\*/g, '<span class="font-semibold italic">$1</span>');

  /****** Bold ******/
  text = text.replaceAll(/\*\*(.+?)\*\*/g, '<span class="font-semibold">$1</span>');

  /****** Italic ******/
  text = text.replaceAll(/\*(.+?)\*/g, '<span class="italic">$1</span>');

  /*****************************************************************************
   * We can use regular expressions to parse all url values in the provided
   * text. This string can be anything, including a full paragraph.
   * The returned component will be the full original text, but with each url
   * replaced with an anchor component.
   *
   * Sometimes, the links are formatted in markdown instead of a simple url,
   * so we need to consider both cases.
   *****************************************************************************/

  /****** Step 1 ******/
  // Convert Markdown links [text](url) into html links. For now,
  // we'll store the html formatted links in an array to prevent the regular
  // expression in Step 2 from catching the href part of the anchor tag.
  // Instead, the links will temporarily be replaced with a placeholder
  // and restored in Step 3.

  const markdownLinkRegEx = /\[([^\]]+)\]\((https?:\/\/[^\s|)]+)\)/g;
  const links: string[] = [];

  const textWithPlaceholders = text.replaceAll(markdownLinkRegEx, (x, text, url) => {
    // Store the html version of the link in the links array
    const link = `<a href="${url}" class="underline hover:no-underline decoration-from-font text-custom-16">${text}</a>`;
    links.push(link);

    // Replace with the placeholder text for now
    return `__PLACEHOLDER_${links.length - 1}__`;
  });

  /****** Step 2 ******/
  // Convert plain URLs into clickable links

  const urlRegEx = /(https?:\/\/[^\s|)]+)/g;
  const textWithAnchors = textWithPlaceholders.replaceAll(urlRegEx, (url) => {
    return `<a href="${url}" class="underline hover:no-underline decoration-from-font text-custom-16">${url}</a>`;
  });

  /****** Step 3 ******/
  //Restore the Markdown links from the links array

  const anchoredText = textWithAnchors.replaceAll(/__PLACEHOLDER_(\d+)__/g, (x, index) => links[parseInt(index)]);

  return anchoredText;
};

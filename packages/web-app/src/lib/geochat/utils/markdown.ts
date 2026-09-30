// src/lib/geochat/utils/markdown.ts

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function formatMarkdown(text: string): string {
  if (!text) {
    return '';
  }

  // downloadable file extensions
  const DOWNLOAD_EXTENSIONS =
      /\.(zip|pdf|csv|xlsx?|docx?|pptx?|geojson|json|xml|gpkg|shp|kml|kmz|7z|rar)(\?|#|$)/i;

  text = escapeHtml(text);

  // normalize line endings
  text = text.replace(/\r\n/g, '\n');

  // headings
  text = text.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  text = text.replace(/^## (.*)$/gm, '<h3>$1</h3>');

  // bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // remove URLs that appear at the end of link labels
  text = text.replace(
      /\[([^\]]+?)\s*\|\s*https?:\/\/[^\]]+\]\((https?:\/\/[^\s)]+)\)/g,
      '[$1]($2)'
  );

  // markdown links
  text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (match, label, url) => {
        const isDownload = DOWNLOAD_EXTENSIONS.test(url);

        return isDownload
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" data-download="true">${label}</a>`
            : `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
  );

  // plain urls
  // text = text.replace(
  //     /(^|[\s>])(https?:\/\/[^\s<]+)/g,
  //     (match, prefix, url) => {
  //       const isDownload = DOWNLOAD_EXTENSIONS.test(url);
  //
  //       return isDownload
  //           ? `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" data-download="true">${url}</a>`
  //           : `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  //     }
  // );

  // unordered lists (- item or * item)
  text = text.replace(/^[-*] (.*)$/gm, '<li>$1</li>\n');
  //text = text.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>\n');  support indented bullets

  // ordered lists
  text = text.replace(/^\d+\. (.*)$/gm, '<li>$1</li>\n');

  // wrap li groups in ul
  text = text.replace(/((?:<li>.*?<\/li>\s*)+)/gs, '<ul>$1</ul>');

  // split paragraphs
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  text = blocks
    .map((block) => {
      // do not wrap block elements
      if (block.startsWith('<h3>') || block.startsWith('<h4>') || block.startsWith('<ul>')) {
        return block;
      }

      return `<p>${block}</p>`;
    })
    .join('');

  return text;
}

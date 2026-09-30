// src/lib/geochat/widget/wordpress-utils.ts

export function getWordPressLang() {
  let lang: 'en' | 'fr' = 'en';
  let locale: 'en-ca' | 'fr-ca' = 'en-ca';
  let alternateLanguageUrl = '';

  const path = window.location.pathname;

  if (path.startsWith('/fr/')) {
    lang = 'fr';
    locale = 'fr-ca';
  }

  const links = document.querySelectorAll('link[rel="alternate"][hreflang]');

  links.forEach((link) => {
    const hreflang = link.getAttribute('hreflang');
    const href = link.getAttribute('href');

    if ((lang === 'en' && hreflang === 'fr') || (lang === 'fr' && hreflang === 'en')) {
      alternateLanguageUrl = href ?? '';
    }
  });

  return {
    lang,
    locale,
    alternateLanguageUrl,
  };
}

export function getWordPressConfig() {
  return (window as any).GeoChatConfig;
}

<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage, getContentLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';
  import type { ContactInfo } from '#lib/db/db-types.js';

  type ContactRow = {
    label: string;
    description: string;
  };

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  // Data from the page
  const data = page.data;
  const contentLang = $derived(getContentLanguage(appLang));
  const items = data.item_v2!;
  let contact: ContactInfo | null = null;

  if (Array.isArray(items.cited)) {
    contact = items.cited.find((contactItem) => contactItem !== null) || null;
  }

  if (!contact && Array.isArray(items.contact)) {
    contact = items.contact.find((contactItem) => contactItem !== null) || null;
  }

  // It is common for the contact data to be the string 'null' instead of just the value null,
  // so we should check for that
  const organizationValue = $derived(contact?.organisation?.[contentLang]);
  const organization = $derived(organizationValue && organizationValue !== 'null' ? organizationValue : translations.general.notApplicable);

  // For the address, we only need one copy of N/A, so we'll add it later
  const address = $derived(contact?.address && contact.address[contentLang] !== 'null' ? contact.address[contentLang] : '');
  const city = contact?.city && contact.city !== 'null' ? contact.city : '';
  const postalCode = contact?.postalcode && contact.postalcode !== 'null' ? contact.postalcode : '';
  const country = $derived(contact?.country && contact.country[contentLang] !== 'null' ? contact.country[contentLang] : '');

  let fullAddress = $derived([address, city, postalCode, country].filter(Boolean).join(', ') || translations.general.notApplicable);

  const individualName = $derived(
    contact?.individual && contact.individual !== 'null' ? contact.individual : translations.general.notApplicable
  );
  const role = $derived(contact?.role && contact.role !== 'null' ? contact['role'] : translations.general.notApplicable);
  const telephoneValue = $derived(contact?.telephone?.[contentLang]);
  const telephone = $derived(telephoneValue && telephoneValue !== 'null' ? telephoneValue : translations.general.notApplicable);
  const faxValue = contact?.fax;
  const fax = $derived(faxValue && faxValue !== 'null' ? faxValue : translations.general.notApplicable);

  const description = $derived(
    contact?.onlineresource?.onlineresource_description ||
      contact?.onlineResource?.onlineResource_Description ||
      translations.general.notApplicable
  );

  const email = $derived(contact?.email ? contact['email'][contentLang] : null);
  const emailLink = $derived(
    email
      ? `<a href="mailto:${email}" class="underline hover:no-underline text-custom-16">${email}</a>`
      : translations.general.notApplicable
  );

  const website = contact?.onlineresource?.onlineresource || contact?.onlineResource?.onlineResource || null;
  const websiteLink = $derived(
    website ? `<a href="${website}" class="underline hover:no-underline text-custom-16">${website}</a>` : translations.general.notApplicable
  );

  // Table Array
  const tableDataArray: Array<ContactRow> = $derived([
    { label: translations.general.organization.toUpperCase(), description: organization },
    { label: translations.components.record.labels.email.toUpperCase(), description: emailLink },
    { label: translations.components.record.labels.address.toUpperCase(), description: fullAddress },
    { label: translations.components.record.labels.individualName.toUpperCase(), description: individualName },
    { label: translations.components.record.labels.role.toUpperCase(), description: role },
    { label: translations.components.record.labels.telephone.toUpperCase(), description: telephone },
    { label: translations.components.record.labels.fax.toUpperCase(), description: fax },
    { label: translations.components.record.labels.website.toUpperCase(), description: websiteLink },
    { label: translations.components.record.labels.description.toUpperCase(), description: description },
  ]);

  // Translation of table column labels
  const tableLabels: ContactRow = $derived({
    label: translations.components.record.labels.label,
    description: translations.components.record.labels.description,
  });
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

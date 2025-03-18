<script lang="ts">
  import { page } from "$app/stores";
	import SortableTable from "$lib/components/sortable-table/sortable-table.svelte";

  type ContactRow = {
    label: string;
    description: string;
  };

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Row labels
  const organizationText = translations?.organization ? translations["organization"] : "Organization";
  const addressText = translations?.address ? translations["address"] : "Address";
  const individualNameText = translations?.individualName ? translations["individualName"] : "Individual Name";
  const roleText = translations?.role ? translations["role"] : "Role";
  const telephoneText = translations?.telephone ? translations["telephone"] : "Telephone";
  const faxText = translations?.fax ? translations["fax"] : "Fax";
  const emailText = translations?.email ? translations["email"] : "Email";
  const websiteText = translations?.website ? translations["website"] : "Website";

  const labelText = translations?.label ? translations["label"] : "Label";
  const descriptionText = translations?.description ? translations["description"] : "Description";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;
  const contact = properties.contact[0];

  const organization = contact?.organisation ? contact["organisation"][langShort] : "N/A";
  const address = contact?.address ? contact["address"][langShort] : "N/A";
  const individualName = contact?.individual ? contact["individual"][langShort] : "N/A";

  // For the english version of the role, the value 'pointOfContact' is really common.
  // We can replace it with the more readable 'point of contact'.
  const role = contact?.role ?
    contact["role"][langShort].replace('pointOfContact', 'point of contact') : "N/A";

  const telephone = contact?.telephone ? contact["telephone"][langShort] : "N/A";
  const fax = contact?.fax ? contact["fax"][langShort] : "N/A";
  const description = contact?.onlineResource?.onlineresource_description ?
    contact["onlineResource"]["onlineresource_description"] : "N/A";

  const email = contact?.email ? contact["email"][langShort] : null;
  const emailLink = email ?
    `<a href="mailto:${email}" class="underline text-custom-16">${email}</a>` : "N/A";

  const website = contact?.onlineResource?.url &&
    contact["onlineResource"]["url"] != null ? contact["onlineResource"]["url"] : null;
  const websiteLink = website ?
    `<a href="${website}" class="underline text-custom-16">${website}</a>` : "N/A";

  // Table Array
  const tableDataArray: Array<ContactRow> = [
    {"label": organizationText.toUpperCase(),"description": organization},
    {"label": addressText.toUpperCase(),"description": address},
    {"label": individualNameText.toUpperCase(),"description": individualName},
    {"label": roleText.toUpperCase(),"description": role},
    {"label": telephoneText.toUpperCase(),"description": telephone},
    {"label": faxText.toUpperCase(),"description": fax},
    {"label": emailText.toUpperCase(),"description": emailLink},
    {"label": websiteText.toUpperCase(),"description": websiteLink},
    {"label": descriptionText.toUpperCase(),"description": description}
  ]

  // Translation of table column labels
  const tableLabels: ContactRow = {"label": labelText,"description": descriptionText};
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

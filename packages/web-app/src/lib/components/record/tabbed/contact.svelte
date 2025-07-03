<script lang="ts">
	import { page } from '$app/stores';
	import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';

	type ContactRow = {
		label: string;
		description: string;
	};

	/******************* Translations *******************/
	const translations = $page.data.t;

	// Row labels
	const organizationText = translations?.organization
		? translations['organization']
		: 'Organization';
	const addressText = translations?.address ? translations['address'] : 'Address';
	const individualNameText = translations?.individualName
		? translations['individualName']
		: 'Individual Name';
	const roleText = translations?.role ? translations['role'] : 'Role';
	const telephoneText = translations?.telephone ? translations['telephone'] : 'Telephone';
	const faxText = translations?.fax ? translations['fax'] : 'Fax';
	const emailText = translations?.email ? translations['email'] : 'Email';
	const websiteText = translations?.website ? translations['website'] : 'Website';

	const labelText = translations?.label ? translations['label'] : 'Label';
	const descriptionText = translations?.description ? translations['description'] : 'Description';

	/******************* Data *******************/
	const data = $page.data;
	const lang = data.lang;
	const langShort = lang.slice(0, 2);
	const items = data.item_v2;
	const contact = items.contact[0];

    // It is common for the contact data to be the string 'null' instead of just the value null,
    // so we should check for that
	const organization = contact?.organisation ? contact.organisation[langShort] : 'N/A';

	// For the address, we only need one copy of N/A, so we'll add it later
	const address = contact?.address && contact.address[langShort] != 'null' ? contact.address[langShort] : '';
	const city = contact?.city && contact.city != 'null' ? contact.city : '';
	const postalCode = contact?.postalcode && contact.postalcode != 'null' ? contact.postalcode : '';
	const country = contact?.country && contact.country[langShort] != 'null' ? contact.country[langShort] : '';
	
	let fullAddress = [address, city, postalCode, country]
        .filter(Boolean)
        .join(', ') || 'N/A';

	const individualName = contact?.individual && contact.individual != 'null' ? contact.individual : 'N/A';
	const role = contact?.role && contact.role != 'null' ? contact['role'] : 'N/A';
	const telephone = contact?.telephone && contact.telephone[langShort] != 'null' ? contact['telephone'][langShort] : 'N/A';
	const fax = contact?.fax && contact.fax != 'null' ? contact['fax'] : 'N/A';

	const description = contact?.onlineResource?.onlineresource_description
		? contact['onlineResource']['onlineresource_description']
		: 'N/A';

	const email = contact?.email ? contact['email'][langShort] : null;
	const emailLink = email
		? `<a href="mailto:${email}" class="underline hover:no-underline text-custom-16">${email}</a>`
		: 'N/A';

	const website =
		contact?.onlineResource?.url && contact['onlineResource']['url'] != null
			? contact['onlineResource']['url']
			: null;
	const websiteLink = website
		? `<a href="${website}" class="underline hover:no-underline text-custom-16">${website}</a>`
		: 'N/A';

	// Table Array
	const tableDataArray: Array<ContactRow> = [
		{ label: organizationText.toUpperCase(), description: organization },
		{ label: emailText.toUpperCase(), description: emailLink },
		{ label: addressText.toUpperCase(), description: fullAddress },
		{ label: individualNameText.toUpperCase(), description: individualName },
		{ label: roleText.toUpperCase(), description: role },
		{ label: telephoneText.toUpperCase(), description: telephone },
		{ label: faxText.toUpperCase(), description: fax },
		{ label: websiteText.toUpperCase(), description: websiteLink },
		{ label: descriptionText.toUpperCase(), description: description }
	];

	// Translation of table column labels
	const tableLabels: ContactRow = { label: labelText, description: descriptionText };
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

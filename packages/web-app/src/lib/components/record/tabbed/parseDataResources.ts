export function parseDataResources(dataResourcesRaw: Array<any>, lang: string) {
	type Translation = {
		en: string;
		fr: string;
	};

	type LanguageReplacements = {
		eng: Translation;
		fra: Translation;
		zxx: Translation;
	};

	const languageReplacements: LanguageReplacements = {
		eng: { en: 'English', fr: 'Anglais' },
		fra: { en: 'French', fr: 'Français' },
		zxx: { en: 'Not available', fr: 'Pas disponible' }
	};

	const translationLang: keyof Translation = lang == 'fr' ? 'fr' : 'en';
	let dataResources: Array<any> = [];
	let description;
	let name;
	let type;
	let format;
	let languageRaw;
	let language;
	let url;

	for (let resource of dataResourcesRaw) {
		description = resource['description'][lang].split(';');
		name = resource['name'][lang];
		url = resource['url'];

		type = description[0];
		format = description[1];
		// languageRaw = description[2].replaceAll(',', ', ');
		// language = languageRaw.replaceAll(
		//   /eng|fra|zxx/gi,
		//   ((x: keyof LanguageReplacements) => languageReplacements[x][translationLang])
		// );

		dataResources.push({
			name: name,
			type: type,
			format: format,
			// 'languages': language,
			url: url
		});
	}

	return dataResources;
}

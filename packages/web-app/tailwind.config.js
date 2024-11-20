/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				custom: {
					1: '#FFFFFF',
					2: '#34792c',
					3: '#357a2d',
					4: '#000029',
					5: '#f6f6f6',
					6: '#dddddd',
					7: '#000000',
					8: '#515ba4',
					9: '#c1c1c1',
					10: '#495197',
					11: '#2B2B2B',
					12: 'rgba(0, 0, 0, 0.5)',
					13: '#140a46',
					14: '#2C3034',
					15: '#212529',
					16: '#535AA4',
					17: '#e0e0e0',
					18: '#00000029',
					19: '#BEBFC2',
					20: '#797979',
					21: '#707070',
					22: '#002E62',
					23: '#130944',
				}
			},
			spacing: {
				144: '36rem'
			},
			boxShadow: {
        'nav': '0 2px 3px white, 0 3px grey;',
				'banner-img': '0 0 200px 50px #140a46 inset'
      },
			maxHeight: {
        'vertical-nav': '90vh',
      },
			maxWidth: {
				'tabbed-title': 'calc(100% - 135px)',
			},
			fontFamily: {
				'open-sans': ['"Open Sans"'],
				'noto-sans': ['"Noto Sans"'],
				'lato': ['"Lato"']
			},
		}
	},
	plugins: []
};

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
					9: '#c1c1c1'
				}
			},
			spacing: {
				144: '36rem'
			}
		}
	},
	plugins: []
};

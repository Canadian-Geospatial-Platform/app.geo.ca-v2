<script context="module" lang="ts">
	import objectToGetParams from '$lib/components/record/objectToGetParams';

	const getBoxPositionOnWindowCenter = (width: number, height: number) => ({
		left: window.outerWidth / 2 + (window.screenX || window.screenLeft || 0) - width / 2,
		top: window.outerHeight / 2 + (window.screenY || window.screenTop || 0) - height / 2
	});

	const getBoxPositionOnScreenCenter = (width: number, height: number) => ({
		top: (window.screen.height - height) / 2,
		left: (window.screen.width - width) / 2
	});

	function windowOpen(
		url: string,
		{ height, width, ...configRest }: { height: number; width: number; [key: string]: any },
		onClose?: (dialog: Window | null) => void
	) {
		const config: { [key: string]: string | number } = {
			height,
			width,
			location: 'no',
			toolbar: 'no',
			status: 'no',
			directories: 'no',
			menubar: 'no',
			scrollbars: 'yes',
			resizable: 'no',
			centerscreen: 'yes',
			chrome: 'yes',
			...configRest
		};

		const shareDialog = window.open(
			url,
			'',
			Object.keys(config)
				.map((key) => `${key}=${config[key]}`)
				.join(', ')
		);

		if (onClose) {
			const interval = window.setInterval(() => {
				try {
					if (shareDialog === null || shareDialog.closed) {
						window.clearInterval(interval);
						onClose(shareDialog);
					}
				} catch (e) {
					/* eslint-disable no-console */
					console.error(e);
					/* eslint-enable no-console */
				}
			}, 1000);
		}

		return shareDialog;
	}

	function facebookLink(url: string, { quote, hashtag }: { quote?: string; hashtag?: string }) {
		return (
			'https://www.facebook.com/sharer/sharer.php' +
			objectToGetParams({
				u: url,
				quote,
				hashtag
			})
		);
	}
	function twitterLink(
		url: string,
		{
			title,
			via,
			hashtags = [],
			related = []
		}: { title?: string; via?: string; hashtags?: string[]; related?: string[] }
	) {
		return (
			'https://twitter.com/share' +
			objectToGetParams({
				url,
				text: title,
				via,
				hashtags: hashtags.length > 0 ? hashtags.join(',') : undefined,
				related: related.length > 0 ? related.join(',') : undefined
			})
		);
	}

	type LinkedInOptions = {
		/** The url-encoded title value that you wish you use. */
		title?: string;
		/** The url-encoded description that you wish you use. */
		summary?: string;
		/** The url-encoded source of the content (e.g. your website or application name) */
		source?: string;
	};

	function linkedinLink(url: string, { title, summary, source }: LinkedInOptions) {
		return (
			'https://linkedin.com/shareArticle' +
			objectToGetParams({ url, mini: 'true', title, summary, source })
		);
	}

	type EmailOptions = {
		body?: string;
		separator?: string;
		subject?: string;
	};

	function emailLink(url: string, { subject, body, separator }: EmailOptions) {
		return 'mailto:' + objectToGetParams({ subject, body: body ? body + separator + url : url });
	}
	export function openShareDialog(
		networkName: string,
		url: string,
		windowHeight: number = 400,
		windowWidth: number = 550,
		onShareWindowClose?: () => void
	) {
		const windowPosition = 'windowCenter';

		const windowConfig = {
			height: windowHeight,
			width: windowWidth,
			...(windowPosition === 'windowCenter'
				? getBoxPositionOnWindowCenter(windowWidth, windowHeight)
				: getBoxPositionOnScreenCenter(windowWidth, windowHeight))
		};
		let link = '';
		if (networkName === 'facebook') {
			link = facebookLink(url, {});
		} else if (networkName === 'twitter') {
			link = twitterLink(url, {});
		} else if (networkName === 'linkedin') {
			link = linkedinLink(url, {});
		} else if (networkName === 'email') {
			link = emailLink(url, {});
		}
		windowOpen(link, windowConfig, onShareWindowClose);
	}
</script>

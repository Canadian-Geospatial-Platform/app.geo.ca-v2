<script lang="ts">
	import Close from '$lib/components/icons/close.svelte';
	import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import { poll } from '$lib/components/component-utils/poller';

	let promise: Promise<Response> | undefined;
	let stopPoller: Function | undefined;

	type Error = {
		message: string;
	};

	interface Props {
		active?: boolean;
		t: any;
	}

	let { active = $bindable(false), t }: Props = $props();

	let jobId: string | undefined = $state();
	let statusJson: object | undefined = $state();
	let resultLink: string | undefined = $state();

	let processSuccessful: boolean = $state(false);
	let error: Error | undefined = $state();

	// Submit the execution request
	export function execute(request: object, url: string) {
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(request),
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			}
		}).then((r) => handleResponse(r));
	}

	function handleResponse(response: Response) {
		if (response.status != 201 || !response.headers.get('location')) {
			error = { message: 'Expected HTTP 201 response but got ' + `${response.status}` };
			return;
		}

		let statusLink = response.headers.get('location');

		response.json().then((json) => {
			statusJson = json;
			jobId = json.jobID;

			[promise, stopPoller] = poll(
				async () => {
					// Main Loop
					try {
						console.log('Polling: ' + statusLink);
						return await fetch(statusLink);
					} catch (error) {
						return console.log(error);
					}
				},
				async (response: Response) => {
					// Validation Function
					console.log('Status: ' + response.status);
					if (response.status != 204 || !response.headers.get('link')) {
						// TODO: Error
					}

					try {
						const json = await response.json();
						console.log('Job Status: ' + json.status);
						statusJson = json;
						processSuccessful = json.status == 'successful';
						return json.status != 'accepted' && json.status != 'running';
					} catch (error) {
						return console.error(error);
					}
				},
				5000 // Loop every 5 seconds
			);

			promise.then((response: Response) => {
				let resultEndpoint: string = statusJson.links.find(
					(link: object) =>
						link.rel == 'http://www.opengis.net/def/rel/ogc/1.0/results' || link.rel == 'result'
				)?.href;
				console.log('Result Endpoint: ' + resultEndpoint);

				if (resultEndpoint != null) {
					console.log('Getting Result URL...');
					fetch(resultEndpoint).then((response) => {
						console.log('Request Status:' + response.status);
						if (response.status != 204) {
							error = { message: 'Expected HTTP 204 but got ' + `${response.status}` };
						} else if (!response.headers.get('link')) {
							error = { message: "Response does not contain a 'link' header." };
						}

						let link = response.headers
							.get('link')
							?.split(',')
							.find((link) => link.includes('; rel="result"'))
							?.split(';')[0];

						if (!link) {
							error = { message: 'No valid result url found in link header.' };
						} else {
							console.log('Link: ' + link);
							resultLink = link?.substring(1, link.length - 1);
							console.log('Parsed Link: ' + resultLink);
						}
					});
				}
			});
		});
	}

	/************* Handlers ***************/
	function handleCloseButtonClick(event: Event) {
		closeModal();
	}

	function closeModal() {
		active = false;
		toggleScroll(active);
		stopPoller?.();

		resultLink = undefined;
		promise = undefined;
		stopPoller = undefined;
	}

	function openIn3d() {
		let sessionID = sessionStorage.getItem('sessionId3d');
		if (!sessionID) {
			if (location.protocol !== 'https:') {
				sessionID = (Math.random() * 1e16).toFixed(0).toString();
			} else {
				sessionID = self.crypto.randomUUID();
			}
			sessionStorage.setItem('sessionId3d', sessionID);
		}

		fetch(
			`https://syxgzh0xkc.execute-api.ca-central-1.amazonaws.com/fhimp_dev/3d/test-sock?sessionID=${sessionID}`,
			{
				method: 'POST',
				body: JSON.stringify({
					type: 'KML',
					args: [
						{
							uid: '45665454654hgj6546546545455646546',
							url: `${resultLink}`,
							title: 'Flood Mapping KML result',
							description: 'Flood Mapping KML result',
							type: 'KML',
							serviceInfo: {
								serviceTitle: 'KML',
								serviceId: 'KML-5919515191',
								serviceUrl: `${resultLink}`
							}
						}
					]
				}),
				headers: {
					'Content-type': 'application/json; charset=UTF-8'
				}
			}
		)
			.then((response) => response.json())
			.then((data) => {
				if (data.clientOpened) {
					let winref = window.open(
						'',
						'3d',
						'menubar=no,location=no,toolbar=no,status=no,directories=no,resizable=yes'
					);
					winref?.focus();
				} else {
					window.open(
						`https://dyb0tihhksw75.cloudfront.net/?sessionID=${sessionID}`,
						'3d',
						'menubar=no,location=no,toolbar=no,status=no,directories=no,resizable=yes'
					);
				}
			});
		// window.open(
		// 	'http://fhimp-chris-test.s3-website.ca-central-1.amazonaws.com/?sessionID=' + jobId,
		// 	'_blank'
		// );
		// fetch(
		// 	'https://syxgzh0xkc.execute-api.ca-central-1.amazonaws.com/fhimp_dev/3d/test-sock?sessionID=' +
		// 		jobId,
		// 	{
		// 		method: 'POST',
		// 		body: JSON.stringify({
		// 			type: 'KML',
		// 			args: [
		// 				{
		// 					uid: '45665454654hgj6546546545455646546',
		// 					url: `${resultLink}`,
		// 					title: 'Flood Mapping KML result',
		// 					description: 'Flood Mapping KML result',
		// 					type: 'KML',
		// 					serviceInfo: {
		// 						serviceTitle: 'KML',
		// 						serviceId: 'KML-5919515191',
		// 						serviceUrl: `${resultLink}`
		// 					}
		// 				}
		// 			]
		// 		}),
		// 		headers: {
		// 			'Content-Type': 'application/json; charset=UTF-8'
		// 		}
		// 	}
		// );
	}
</script>

<div
	class={[
		'fixed flex justify-center z-40 inset-0 bg-custom-7/75 overflow-y-scroll hide-scroll pb-4',
		!active && 'hidden'
	]}
>
	<div
		class="md:grid md:grid-cols-6 bg-custom-1 border border-custom-21 w-full md:w-3/5 h-fit md:mt-36 m-5 md:m-0"
	>
		<div class="col-span-5 flex flex-col gap-5 px-5 pb-5 pt-8 font-custom-style-body-1">
			<div>
				<h1 class="font-custom-style-h1-2">{t['status']}</h1>
				{#if jobId}
					<p>{t['jobStatusIntro']}</p>
					<ul>
						<li>{t['createdOn']} {statusJson.created}</li>
						<li>{t['startedOn']} {statusJson.started}</li>
						<li>{t['updatedOn']} {statusJson.updated}</li>
						<li>{t['finishedOn']} {statusJson.finished}</li>
						<li>{t['statusColon']} {statusJson.status}</li>
						<li>{t['progress']} {statusJson.progress}%</li>
						<li>{t['message']} {statusJson.message}</li>
					</ul>
					{#if processSuccessful && !resultLink}
						<p>Error: Failed to get result URL.</p>
					{/if}
				{:else if error}
					<p>Error: Invalid Response</p>
					<p>{error.message}</p>
				{/if}
			</div>
		</div>
		<div
			id="close-button"
			class="absolute md:static top-2 right-4 col-span-1 px-5 pt-8 justify-self-end"
		>
			<button
				type="button"
				class="flex justify-center items-center border border-custom-16 rounded-[50%]
            h-9 w-9 md:h-[3.0625rem] md:w-[3.0625rem] hover:bg-custom-16 text-custom-16
            hover:text-custom-1"
				onclick={handleCloseButtonClick}
			>
				<Close classes="h-4 md:h-[1.3125rem]" />
			</button>
		</div>
		<!-- <div class="col-span-6 gap-5 px-5 pb-5 pt-8 font-custom-style-body-1"> -->
		<!-- <MapPreview /> -->
		<!-- </div> -->
		<div
			id="bottom-buttons"
			class="grid grid-cols-1 md:grid-cols-2 col-span-6 bg-custom-5 md:border-t border-custom-21 px-5 py-7 md:py-[1.125rem] gap-y-8"
		>
			<div>
				<a
					href={resultLink}
					class="row-start-1 md:row-start-2 w-auto md:w-auto justify-self-start h-12 md:h-auto {resultLink
						? 'button-3'
						: 'button-3-disabled'}"
				>
					{t['download']}
				</a>
				<a
					href={resultLink}
					class="row-start-2 md:row-start-2 w-auto md:w-auto justify-self-start h-12 md:h-auto {resultLink
						? 'button-3'
						: 'button-3-disabled'}"
				>
					{t['openIn2D']}
				</a>
				<button
					onclick={openIn3d}
					class="row-start-2 md:row-start-2 w-auto md:w-auto justify-self-start h-12 md:h-auto {resultLink
						? 'button-3'
						: 'button-3-disabled'}"
				>
					{t['openIn3D']}
				</button>
			</div>
			<button
				class="w-full md:w-auto justify-self-end button-5 h-12 md:h-auto shadow-[0rem_0.1875rem_0.375rem_#00000029]"
				onclick={handleCloseButtonClick}>{t['close']}</button
			>
		</div>
	</div>
</div>

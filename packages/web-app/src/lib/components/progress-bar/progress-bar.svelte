<script lang="ts">
	interface Props {
		progress: number;
	}

	let { progress = $bindable(0) }: Props = $props();

	var i = 0;
	function move() {
		if (i == 0) {
			i = 1;
			var elem = document.getElementById('myBar');
			var width = 10;
			var id = setInterval(frame, 10);
			function frame() {
				if (width >= 100) {
					clearInterval(id);
					i = 0;
				} else {
					width++;
					elem.style.width = width + '%';
					elem.innerHTML = width + '%';
				}
			}
		}
	}
</script>

<div id="myProgress">
	<div id="myBar">{progress}%</div>
</div>

<style>
	#myProgress {
		width: 100%;
		background-color: #ddd;
	}

	#myBar {
		width: 10%;
		height: 30px;
		background-color: #04aa6d;
		text-align: center;
		line-height: 30px;
		color: white;
	}
</style>

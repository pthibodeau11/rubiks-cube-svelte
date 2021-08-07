<script>
	export let name;
	import Nav from './Nav.svelte';
	import Steps from './Steps.svelte';
	import Timer from './Timer/App2.svelte'
	let page

</script>


<Nav bind:page/>
{#if page === 'Home'}
<main>
	<Steps />
</main>
{:else if page === 'Timer'}
<main>
	<Timer />
</main>
{/if}


<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		display: flex;
		flex-direction: row;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
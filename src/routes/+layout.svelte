<svelte:head>
  <title>Game of Towers</title>
</svelte:head>

<div class="app">
  <slot />
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: #11141a;
    color: #f5f5f5;
  }

  :global(button) {
    font-family: inherit;
  }

  .app {
    min-height: 100vh;
  }
</style>

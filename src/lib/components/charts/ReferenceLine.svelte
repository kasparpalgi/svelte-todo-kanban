<script lang="ts">
  import { getContext } from 'svelte';
  import type { LayerCakeContext } from '$lib/types/charting';

  export let values: number[] = [];
  export let stroke = '#ccc';
  export let strokeWidth = 1;
  export let strokeDasharray = '2 2';

  const { xScale, yScale, width } = getContext<LayerCakeContext>('LayerCake');
</script>

{#each values as value}
  <line
    x1={0}
    y1={$yScale(value)}
    x2={$width}
    y2={$yScale(value)}
    {stroke}
    stroke-width={strokeWidth}
    stroke-dasharray={strokeDasharray}
  />
{/each}

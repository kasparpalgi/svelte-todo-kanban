import type { ScaleLinear, ScaleTime } from 'd3-scale';
import type { PenonData } from '../types/penon';

// Define a generic Svelte store type
interface SvelteStore<T> {
    subscribe: (
        this: void,
        run: (value: T) => void,
        invalidate?: (value?: T) => void
    ) => () => void;
}

export interface LayerCakeContext {
    xScale: SvelteStore<ScaleTime<number, number>>;
    yScale: SvelteStore<ScaleLinear<number, number>>;
    width: SvelteStore<number>;
    height: SvelteStore<number>;
    xGet: SvelteStore<(d: PenonData) => any>;
    yGet: SvelteStore<(d: PenonData) => any>;
    data: SvelteStore<PenonData[]>;
    config: SvelteStore<{
        x: string;
        y: string;
        r: string;
        data: PenonData[];
    }>;
}

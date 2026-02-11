import type { ScaleLinear, ScaleTime } from 'd3-scale';
import type { PenonData } from '../types/penon';

export interface LayerCakeContext {
    xScale: ScaleTime<number, number>;
    yScale: ScaleLinear<number, number>;
    width: number;
    height: number;
    xGet: (d: PenonData) => any;
    yGet: (d: PenonData) => any;
    data: PenonData[]; // Added data property
    config: {
        x: string;
        y: string;
        r: string;
        data: PenonData[];
    };
    // LayerCake also provides these as reactive stores if you use $syntax,
    // but when accessing directly from context, they are the raw values/functions.
    // We'll define them as such for direct access.
}

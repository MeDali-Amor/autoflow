import type { NodeKind } from "../engine/types";
import type { Port } from "./types";

export const nodeVariantsMap: Record<
    NodeKind,
    {
        inputs: Port[];
        outputs: Port[];
        type: NodeKind;
        config?: {
            fn: (x: number, y: number) => unknown;
            seed?: number;
        };
    }
> = {
    Trigger: {
        inputs: [] as Port[],
        outputs: [{ id: "out", label: "out" }],
        type: "Trigger",
        config: undefined,
    },
    Map: {
        inputs: [{ id: "in", label: "in" }],
        outputs: [{ id: "out", label: "out" }],
        type: "Map",
        config: {
            fn: (x: number): number => x * 10,
        },
    },
    Filter: {
        inputs: [{ id: "in", label: "in" }],
        outputs: [{ id: "out", label: "out" }],
        type: "Filter",
        config: {
            fn: (x: number) => x > 40,
        },
    },
    Scan: {
        inputs: [{ id: "in", label: "in" }],
        outputs: [{ id: "out", label: "out" }],
        type: "Scan",
        config: {
            fn: (acc: number, x: number) => acc + x,
            seed: 0,
        },
    },
    Log: {
        inputs: [{ id: "in", label: "in" }],
        outputs: [{ id: "out", label: "out" }],
        type: "Log",
        config: undefined,
    },
    Merge: {
        inputs: [
            { id: "in1", label: "in 1" },
            { id: "in2", label: "in 2" },
        ],
        outputs: [{ id: "out", label: "out" }],
        type: "Merge",
        config: undefined,
    },
    Combine: {
        inputs: [
            { id: "in1", label: "in 1" },
            { id: "in2", label: "in 2" },
        ],
        outputs: [{ id: "out", label: "out" }],
        type: "Combine",
        config: {
            fn: (x, y) => x + y,
        },
    },
};

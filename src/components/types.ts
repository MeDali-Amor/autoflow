import type { NodeKind } from "../engine/types";

export type NodeType<T> = {
    type: NodeKind;
    config?: {
        fn: <R>(x: T, ...args: unknown[]) => R;
        seed?: T;
    };
};
export interface Port {
    id: string;
    label: string;
}

export interface NodeData<T> {
    id: string;
    type: NodeKind;
    label: string;
    x: number;
    y: number;
    config?: {
        fn: <R>(x: T, ...args: unknown[]) => R;
        seed?: T;
    };
    inputs?: Port[];
    outputs?: Port[];
}

export interface Edge {
    id: string;
    from: string;
    fromPort: string;
    to: string;
    toPort: string;
    toInputIndex?: number; // 🆕 add this for Combine/Merge/
}

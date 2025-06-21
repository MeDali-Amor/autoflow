import type { NodeKind } from "../engine/types";

export type NodeType<T> = {
    type: NodeKind;
    config?: {
        fn: <R>(x: T) => R;
        seed: T;
    };
};

export interface NodeData<T> {
    id: string;
    type: NodeKind;
    label: string;
    x: number;
    y: number;
    config?: {
        fn: <R>(x: T) => R;
        seed: T;
    };
}

export interface Edge {
    id: string;
    from: string;
    to: string;
}

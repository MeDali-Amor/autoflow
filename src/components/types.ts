import type { NodeType } from "./node-types";

export interface NodeData {
    id: string;
    type: NodeType;
    label: string;
    x: number;
    y: number;
}

export interface Edge {
    id: string;
    from: string;
    to: string;
}

import type { Node } from "./node";

export interface Edge {
    id: string;
    from: string; // source node id
    to: string; // target node id
}

export interface Graph {
    nodes: Record<string, Node<unknown, unknown>>;
    edges: Edge[];
}

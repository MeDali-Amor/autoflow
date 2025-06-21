export type NodeType = "trigger" | "action" | "filter";

export interface Position {
    x: number;
    y: number;
}

export interface Node<Input = unknown, Output = unknown> {
    id: string;
    type: NodeType;
    label: string;
    position: Position;
    inputs?: Input;
    outputs?: Output;
}

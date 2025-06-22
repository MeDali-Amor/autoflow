import type { Observable } from "./reactive";

export type NodeKind =
    | "Trigger"
    | "Map"
    | "Scan"
    | "Merge"
    | "Filter"
    | "Log"
    | "Combine";

export type NodeSpec<T> = {
    kind: NodeKind;
    stream: Observable<T>;
    trigger?: (val: T) => void;
};

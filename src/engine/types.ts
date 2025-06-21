import type { Observable } from "./reactive";

export type NodeKind = "Trigger" | "Map" | "Scan" | "Filter" | "Log";

export type NodeSpec<T> = {
    kind: NodeKind;
    stream: Observable<T>;
    trigger?: (val: T) => void;
};

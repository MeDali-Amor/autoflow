import type { Observable, Subject } from "./reactive";

export type NodeKind = "Trigger" | "Map" | "Filter" | "Log";

export type NodeStream<T> =
    | {
          kind: "Trigger";
          stream: Observable<T>;
          trigger: (val: T) => void;
      }
    | { kind: "Map"; stream: Observable<T> }
    | { kind: "Filter"; stream: Observable<T> }
    | { kind: "Log"; stream: Observable<T> };

export type NodeSpec =
    | {
          kind: "Trigger";
          stream: Subject<number>;
          trigger: (val: number) => void;
      }
    | { kind: "Map" | "Filter" | "Log" | "Scan"; stream: Observable<number> };

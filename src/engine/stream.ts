import type { NodeData } from "../components/types";
import {
    createDebugNode,
    createFilterNode,
    createMapNode,
    createScanNode,
    createTrigger,
} from "./nodes";
import { merge, type Subject } from "./reactive";
import type { NodeSpec } from "./types";

export function createNodeStream<T>(
    node: NodeData<T>,
    input$: Subject<T>,
    extraInputs: Subject<T>[] = []
): NodeSpec<T> {
    const config = node.config;

    switch (node.type) {
        case "Trigger": {
            const { stream, trigger } = createTrigger<T>();
            return { kind: "Trigger", stream, trigger };
        }

        case "Map": {
            const fn = config?.fn ?? ((x) => x);
            return {
                kind: "Map",
                stream: createMapNode(input$, fn),
            };
        }

        case "Scan": {
            const reducer = config?.fn ?? ((acc: T) => acc);
            const seed = config?.seed ?? undefined;
            return {
                kind: "Scan",
                stream: createScanNode(input$, reducer, seed),
            };
        }
        case "Merge": {
            const other$ = extraInputs[0];
            if (!other$) throw new Error("Merge node requires a second input");
            return {
                kind: "Merge",
                stream: merge(input$, other$),
            };
        }

        case "Filter": {
            const predicate = config?.fn ?? (() => true);
            return {
                kind: "Filter",
                stream: createFilterNode(input$, predicate),
            };
        }

        case "Log":
            return {
                kind: "Log",
                stream: createDebugNode(input$, node.label),
            };

        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

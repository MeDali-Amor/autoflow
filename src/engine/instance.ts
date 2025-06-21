import type { Edge, NodeData } from "../components/types";
import { connectGraphConnection } from "./graph";
import { createObservable, type Subject } from "./reactive";
import { createNodeStream } from "./stream";
import type { NodeSpec } from "./types";

export interface GraphInstance<T> {
    trigger: (nodeId: string, value: T) => void;
    destroy: () => void;
}

export function buildGraphInstance<T>(
    nodes: NodeData<T>[],
    edges: Edge[]
): GraphInstance<T> {
    const inputMap = new Map<string, Subject<T>>();
    const streamMap = new Map<string, NodeSpec<T>>();

    for (const node of nodes) {
        const input$ = createObservable<T>();
        inputMap.set(node.id, input$);
        const spec = createNodeStream<T>(node, input$);
        streamMap.set(node.id, spec);
    }

    const connect = (
        from?: NodeSpec<T>,
        to?: Subject<T>
    ): (() => void) | null => {
        if (!from || !to) return null;
        return connectGraphConnection(from.stream, to.emit, (x) => x);
    };

    const cleanups = edges
        .map(({ from, to }) => connect(streamMap.get(from), inputMap.get(to)))
        .filter((x): x is () => void => !!x);

    // Force subscriptions for "Log" nodes
    for (const node of nodes) {
        const spec = streamMap.get(node.id);
        if (spec?.kind === "Log") {
            spec.stream.subscribe(() => {});
        }
    }

    return {
        trigger: (id, value) => {
            const node = streamMap.get(id);
            if (node?.kind === "Trigger") {
                node.trigger?.(value);
            }
        },
        destroy: () => cleanups.forEach((fn) => fn()),
    };
}

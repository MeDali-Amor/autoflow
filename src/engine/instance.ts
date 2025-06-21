import type { NodeType } from "../components/node-types";
import type { Edge, NodeData } from "../components/types";
import { connectGraphConnection } from "./graph";
import {
    createDebugNode,
    createFilterNode,
    createMapNode,
    createScanNode,
    createTrigger,
} from "./nodes";
import { createObservable, type Subject } from "./reactive";
import type { NodeSpec } from "./types";

type Builder = (node: NodeData, input$: Subject<number>) => NodeSpec;

const builders: Record<NodeType, Builder> = {
    Trigger: () => {
        const { stream, trigger } = createTrigger<number>();
        return { kind: "Trigger", stream, trigger };
    },
    Map: (_, input$) => ({
        kind: "Map",
        stream: createMapNode(input$, (x) => x * 2),
    }),
    Scan: (_, input$) => ({
        kind: "Scan",
        stream: createScanNode(input$, (acc, v) => acc + v, 0),
    }),
    Filter: (_, input$) => ({
        kind: "Filter",
        stream: createFilterNode(input$, (x) => x > 10),
    }),
    Log: (node, input$) => {
        return {
            kind: "Log",
            stream: createDebugNode(input$, node.label),
        };
    },
};

export function createNodeStream(
    node: NodeData,
    input$: Subject<number>
): NodeSpec {
    return builders[node.type](node, input$);
}

export interface GraphInstance {
    trigger: (nodeId: string, value: number) => void;
    destroy: () => void;
}

export function buildGraphInstance(
    nodes: NodeData[],
    edges: Edge[]
): GraphInstance {
    const inputMap = new Map<string, Subject<number>>(
        nodes.map((n) => [n.id, createObservable<number>()])
    );

    const streamMap = new Map<string, NodeSpec>(
        nodes.map((node) => {
            const input$ = inputMap.get(node.id)!;
            return [node.id, createNodeStream(node, input$)];
        })
    );

    const connect = (
        from?: NodeSpec,
        to?: Subject<number>
    ): (() => void) | null => {
        if (!from || !to) return null;
        return connectGraphConnection(from.stream, to.emit, (x) => x);
    };

    const cleanups = edges
        .map(({ from, to }) => connect(streamMap.get(from), inputMap.get(to)))
        .filter((fn): fn is () => void => !!fn);

    // ✅ Force side-effects (tap) to run by subscribing to Log nodes
    for (const node of nodes) {
        const spec = streamMap.get(node.id);
        if (spec?.kind === "Log") {
            spec.stream.subscribe(() => {
                // Intentionally empty — needed to activate tap()
            });
        }
    }

    return {
        trigger: (nodeId, value) => {
            const node = streamMap.get(nodeId);
            if (node?.kind === "Trigger") {
                node.trigger(value);
            }
        },
        destroy: () => cleanups.forEach((dispose) => dispose()),
    };
}

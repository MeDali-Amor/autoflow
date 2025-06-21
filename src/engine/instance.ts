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
    const inputMap = new Map<string, Subject<T>[]>();
    const streamMap = new Map<string, NodeSpec<T>>();

    // 1. Create all node inputs (multiple per node if needed)
    for (const node of nodes) {
        const inputCount = getInputCount(node); // <-- helper you define
        const inputs = Array.from({ length: inputCount }, () =>
            createObservable<T>()
        );
        inputMap.set(node.id, inputs);
    }

    // 2. Create streams and attach them to the streamMap
    for (const node of nodes) {
        const inputs = inputMap.get(node.id)!;
        const [input$, ...extraInputs] = inputs;
        const spec = createNodeStream(node, input$, extraInputs);
        streamMap.set(node.id, spec);
    }

    // 3. Wire up connections with optional input index
    const connect = (
        from?: NodeSpec<T>,
        toList?: Subject<T>[],
        toInputIndex: number = 0
    ): (() => void) | null => {
        if (!from || !toList || !toList[toInputIndex]) return null;
        return connectGraphConnection(
            from.stream,
            toList[toInputIndex].emit,
            (x) => x
        );
    };

    // 4. Create cleanups
    const cleanups = edges
        .map(({ from, to, toInputIndex }) =>
            connect(streamMap.get(from), inputMap.get(to), toInputIndex)
        )
        .filter((fn): fn is () => void => !!fn);

    // 5. Subscribe to "Log" nodes to force tap execution
    for (const node of nodes) {
        const spec = streamMap.get(node.id);
        if (spec?.kind === "Log") {
            spec.stream.subscribe(() => {}); // activate tap
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

function getInputCount<T>(node: NodeData<T>): number {
    switch (node.type) {
        case "Merge":
            // case "Combine":
            return 2;
        default:
            return 1;
    }
}

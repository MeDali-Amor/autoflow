import {
    createTrigger,
    createMapNode,
    createFilterNode,
    createDebugNode,
} from "./engine/nodes";

export function runTestWorkflow() {
    const { stream, trigger } = createTrigger<number>();

    const filtered = createFilterNode(stream, (x) => x > 2);
    const mapped = createMapNode(filtered, (x) => x * 5);
    const debugged = createDebugNode(mapped, "Output");

    debugged.subscribe((val) => {
        console.log("🌊 Emitted to next node:", val);
    });

    trigger(1); // ignored
    trigger(3); // goes through all
    trigger(5); // goes through all
}

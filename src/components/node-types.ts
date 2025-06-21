export const NodeTypes = {
    Trigger: "Trigger",
    Map: "Map",
    Filter: "Filter",
    Log: "Log",
    Scan: "Scan",
    // Add more...
} as const;

export type NodeType = (typeof NodeTypes)[keyof typeof NodeTypes];

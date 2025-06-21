"use client";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { buildGraphInstance, type GraphInstance } from "../engine/instance";
import type { NodeKind } from "../engine/types";
import { Node } from "./Node";
import { NodePalette } from "./NodePalette";
import type { Edge, NodeData } from "./types";
import { nodeVariantsMap } from "./utils";

export function Canvas() {
    const [nodes, setNodes] = useState<NodeData<number>[]>([]);
    const [draggedType, setDraggedType] = useState<NodeKind | null>(null);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [connectingFrom, setConnectingFrom] = useState<{
        nodeId: string;
        portId: string;
    } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!draggedType) return;

        const canvas = e.currentTarget;
        const canvasRect = canvas.getBoundingClientRect();

        const estimatedNodeWidth = 120;
        const estimatedNodeHeight = 40;

        const x = e.clientX - canvasRect.left - estimatedNodeWidth / 2;
        const y = e.clientY - canvasRect.top - estimatedNodeHeight / 2;

        setNodes((prev) => [
            ...prev,
            {
                id: uuid(),
                type: draggedType,
                label: `${draggedType} Node`,
                inputs: nodeVariantsMap[draggedType].inputs,
                outputs: nodeVariantsMap[draggedType].outputs,
                x,
                y,
                config: nodeVariantsMap[draggedType].config ?? undefined,
            } as NodeData<number>,
        ]);

        setDraggedType(null);
    };
    const handleConnectStart = (nodeId: string, portId: string) => {
        setConnectingFrom({ nodeId, portId });
    };

    const handleConnectEnd = (nodeId: string, portId: string) => {
        if (connectingFrom) {
            const targetNode = nodes.find((n) => n.id === nodeId);
            const variant = nodeVariantsMap[targetNode?.type as NodeKind];

            // 🧠 Find the index of the port you're connecting to
            const toInputIndex = variant?.inputs.findIndex(
                (port) => port.id === portId
            );
            setEdges((prev) => [
                ...prev,
                {
                    id: `${connectingFrom.nodeId}:${connectingFrom.portId}->${nodeId}:${portId}`,
                    from: connectingFrom.nodeId,
                    fromPort: connectingFrom.portId,
                    to: nodeId,
                    toPort: portId,
                    toInputIndex,
                },
            ]);
            setConnectingFrom(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };
    const handleMouseUpCanvas = () => {
        // Cancel if user clicks outside of a port
        if (connectingFrom) {
            setConnectingFrom(null);
        }
    };
    const graphRef = useRef<GraphInstance<number> | null>(null);

    useEffect(() => {
        graphRef.current?.destroy();
        graphRef.current = buildGraphInstance(nodes, edges);
        return () => graphRef.current?.destroy();
    }, [nodes, edges]);
    return (
        <div className="flex w-full h-full">
            <NodePalette onDragStart={(type) => setDraggedType(type)} />
            <div
                className="relative flex-1 bg-gray-100 overflow-hidden"
                onMouseUp={handleMouseUpCanvas}
                // onClickCapture={(e) => e.stopPropagation()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onMouseMove={handleMouseMove}
            >
                {/* Edge Wires SVG Layer */}
                {/* {connectingFrom &&
                    (() => {
                        const fromNode = nodes.find(
                            (n) => n.id === connectingFrom.nodeId
                        );
                        if (!fromNode) return null;

                        const portIndex = fromNode.outputs?.findIndex(
                            (p) => p.id === connectingFrom.portId
                        );
                        if (portIndex === undefined || portIndex < 0)
                            return null;

                        const fromX = fromNode.x + 120; // right side
                        const fromY = fromNode.y + 20 + portIndex * 20;

                        return (
                            <line
                                x1={fromX}
                                y1={fromY}
                                x2={mousePos.x}
                                y2={mousePos.y}
                                stroke="gray"
                                strokeWidth={2}
                                strokeDasharray="4 2"
                            />
                        );
                    })()} */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {edges.map((edge) => {
                        const from = nodes.find((n) => n.id === edge.from);
                        const to = nodes.find((n) => n.id === edge.to);
                        if (!from || !to) return null;
                        const fromIndex =
                            from.outputs?.findIndex(
                                (p) => p.id === edge.fromPort
                            ) ?? 0;
                        const toIndex =
                            to.inputs?.findIndex((p) => p.id === edge.toPort) ??
                            0;

                        const fromX = from.x + 120;
                        const fromY = from.y + 20 + fromIndex * 20;
                        const toX = to.x;
                        const toY = to.y + 20 + toIndex * 20;

                        return (
                            <line
                                key={edge.id}
                                x1={fromX}
                                y1={fromY}
                                x2={toX}
                                y2={toY}
                                stroke="black"
                                strokeWidth={2}
                            />
                        );
                    })}
                    {/* Live preview */}
                    {connectingFrom &&
                        (() => {
                            const node = nodes.find(
                                (n) => n.id === connectingFrom.nodeId
                            );
                            if (!node) return null;
                            const portIndex =
                                node.outputs?.findIndex(
                                    (p) => p.id === connectingFrom.portId
                                ) ?? 0;
                            const x1 = node.x + 120;
                            const y1 = node.y + 20 + portIndex * 20;

                            return (
                                <line
                                    x1={x1}
                                    y1={y1}
                                    x2={mousePos.x}
                                    y2={mousePos.y}
                                    stroke="gray"
                                    strokeWidth={2}
                                    strokeDasharray="4 2"
                                />
                            );
                        })()}
                </svg>
                {nodes.map((node) => (
                    <Node
                        key={node.id}
                        node={node}
                        trigger={() => graphRef.current?.trigger(node.id, 1)}
                        onMove={(id, x, y) => {
                            setNodes((prev) =>
                                prev.map((n) =>
                                    n.id === id ? { ...n, x, y } : n
                                )
                            );
                        }}
                        onPortConnectStart={handleConnectStart}
                        onPortConnectEnd={handleConnectEnd}
                    />
                ))}
            </div>
        </div>
    );
}

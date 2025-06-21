"use client";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { buildGraphInstance, type GraphInstance } from "../engine/instance";
import type { NodeKind } from "../engine/types";
import { Node } from "./Node";
import { NodePalette, nodeVariantsMap } from "./NodePalette";
import type { Edge, NodeData } from "./types";

export function Canvas() {
    const [nodes, setNodes] = useState<NodeData<number>[]>([]);
    const [draggedType, setDraggedType] = useState<NodeKind | null>(null);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
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
                x,
                y,
                config: nodeVariantsMap[draggedType].config ?? undefined,
            } as NodeData<number>,
        ]);

        setDraggedType(null);
    };
    const handleConnectStart = (nodeId: string, port: "output") => {
        if (port === "output") {
            setConnectingFrom(nodeId);
        }
    };

    const handleConnectEnd = (toNodeId: string, port: "input" | "output") => {
        if (port === "input" && connectingFrom) {
            const newEdge: Edge = {
                id: `${connectingFrom}->${toNodeId}`,
                from: connectingFrom,
                to: toNodeId,
            };
            setEdges((prev) => [...prev, newEdge]);
            setConnectingFrom(null); // ✅ connection complete
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
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {/* Existing edges */}
                    {edges.map((edge) => {
                        const fromNode = nodes.find((n) => n.id === edge.from);
                        const toNode = nodes.find((n) => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        const fromX = fromNode.x + 120;
                        const fromY = fromNode.y + 20;
                        const toX = toNode.x;
                        const toY = toNode.y + 20;

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

                    {/* Live preview edge while connecting */}
                    {connectingFrom &&
                        (() => {
                            const fromNode = nodes.find(
                                (n) => n.id === connectingFrom
                            );
                            if (!fromNode) return null;
                            const fromX = fromNode.x + 120;
                            const fromY = fromNode.y + 20;

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

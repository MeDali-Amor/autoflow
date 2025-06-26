"use client";
import { useMemo, useState } from "react";
import { createBehaviorSubject } from "../engine/reactive";
import { instanciate } from "./graph";
import { Node } from "./Node";
import { NodePalette } from "./NodePalette";
import type { SomeNodeConfig, SomeNodeData, SomePort } from "./types";
import { DropDynLine, DrowPortLine } from "./Line";

export function Canvas() {
    const [nodes, setNodes] = useState<SomeNodeData[]>([]);
    const [draggedTemplate, setDraggedTemplate] = useState<{ config: SomeNodeConfig, label: string } | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<{ port: SomePort, index: number, node: SomeNodeData } | null>(null);
    const mousePos = useMemo(() => createBehaviorSubject<{ x: number, y: number }>({ x: 0, y: 0 }), []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();
        if (!draggedTemplate) return;

        const canvas = e.currentTarget;
        const canvasRect = canvas.getBoundingClientRect();

        const estimatedNodeWidth = 120;
        const estimatedNodeHeight = 40;

        const x = e.clientX - canvasRect.left - estimatedNodeWidth / 2;
        const y = e.clientY - canvasRect.top - estimatedNodeHeight / 2;

        draggedTemplate.config((config) => {
            const node = instanciate(config, draggedTemplate.label, { x, y });
            setNodes((prev) => [...prev, c => c(node)])
        });

        setDraggedTemplate(null);
    };
    const handleConnectEnd = (node: SomeNodeData) => {
        if (connectingFrom) {
            connectingFrom.port(port => {
                node(n => {
                    port.linkedTo.emit(equal(n.config.type, port.type) ? node as SomeNodeData<typeof port.type> : null);
                    setConnectingFrom(null);
                })
            })
            return true
        }
        return false
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mousePos.emit({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };
    const handleMouseUpCanvas = () => {
        // Cancel if user clicks outside of a port
        if (connectingFrom) {
            connectingFrom.port(port => {
                port.linkedTo.emit(null);
            });
            setConnectingFrom(null);
        }
    };
    return (
        <div className="flex w-full h-full">
            <NodePalette onDragStart={(config, label) => setDraggedTemplate({ config, label })} />
            <div
                className="relative flex-1 bg-gray-100 overflow-hidden"
                onMouseUp={handleMouseUpCanvas}
                // onClickCapture={(e) => e.stopPropagation()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onMouseMove={connectingFrom ? handleMouseMove : undefined}
            >
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {nodes.map((n, i) => n(n => n.inputs.map((x, j) => x(x => <DrowPortLine key={`${i}-${j}`} port={x} to={n} index={j} />))))}
                    {/* Live preview */}
                    {connectingFrom &&
                        connectingFrom.node((node) => {

                            return (
                                <DropDynLine
                                    hOffeset={0}
                                    toIndex={connectingFrom.index}
                                    to={node.position}
                                    from={mousePos}
                                    type={connectingFrom.port(p=>p.type)}
                                    stroke="gray"
                                    strokeDasharray="4 2"
                                />
                            );
                        })}
                </svg>
                {nodes.map((node) => node(node =>
                    <Node
                        key={node.id}
                        node={node}
                        draggingIndex={connectingFrom?.node(n => equal(n, node)) ? connectingFrom.index : null}
                        onMove={(x, y) => node.position.emit({ x, y })}
                        onPortConnectStart={(port, index) => {
                            const {x, y} = node.position.value
                            mousePos.emit({x, y: y + 20 + index * 20});
                            port(port => port.linkedTo.emit(null));
                            setConnectingFrom({ port, index, node: c => c(node) })
                        }}
                        onPortConnectEnd={() => handleConnectEnd(c => c(node))}
                    />
                ))}
            </div>
        </div>
    );
}


const equal = (
    n1: unknown,
    n2: unknown,
) => n1 === n2
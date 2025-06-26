"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { v4 as uuid } from "uuid";
import { createBehaviorSubject, NEVER, switchMap, type BehaviorSubject, type Observable } from "../engine/reactive";
import { Node } from "./Node";
import { NodePalette } from "./NodePalette";
import type { MapPort, MapTypeObservable, NodeData, Port, SomeNodeConfig, SomeNodeData, SomePort, Types } from "./types";

export type { NodeData } from "./types";

export function Canvas() {
    const [nodes, setNodes] = useState<SomeNodeData[]>([]);
    const [draggedTemplate, setDraggedTemplate] = useState<{ config: SomeNodeConfig, label: string } | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<{ port: SomePort, index: number, node: SomeNodeData } | null>(null);
    const mousePos = useMemo(() => createBehaviorSubject<{ x: number, y: number }>({ x: 0, y: 0 }), []);
    Object.assign(window, { nodes })
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
            type In = typeof config.inputTypes;
            const inputs = config.inputTypes.map((type) => {
                const node = {
                    id: uuid(),
                    type,
                    linkedTo: createBehaviorSubject<null | SomeNodeData<typeof type>>(null)
                }
                return c => c(node)
            }) as MapPort<In>
            const args = inputs.map(x => x((x): Observable<Types[keyof Types]> => switchMap(x.linkedTo, v => v ? v(v => v.next) : NEVER))) as MapTypeObservable<In>
            const out = config.operator(...args)
            const _next = createBehaviorSubject<Observable<Types[typeof config.type]>>(NEVER);
            const node: NodeData<In, typeof config.type> = {
                id: uuid(),
                position: createBehaviorSubject({ x, y }),
                config,
                inputs: inputs as MapPort<In>,
                width$: createBehaviorSubject(0),
                label: draggedTemplate.label,
                result: out,
                _next,
                next: switchMap(_next, v => v)
            }

            setNodes((prev) => [...prev, c => c(node)])
        });

        setDraggedTemplate(null);
    };
    const handleConnectEnd = (node: SomeNodeData) => {
        if (connectingFrom) {
            connectingFrom.port(port => {
                return node(n => {
                    port.linkedTo.emit(equal(n.config.type, port.type) ? node as SomeNodeData<typeof port.type> : null);
                    setConnectingFrom(null);
                })
            })

        }
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
                        onMove={(x, y) => node.position.emit({ x, y })}
                        onPortConnectStart={(port, index) => setConnectingFrom({ port, index, node: c => c(node) })}
                        onPortConnectEnd={() => handleConnectEnd(c => c(node))}
                    />
                ))}
            </div>
        </div>
    );
}


const DrowPortLine = <In extends (keyof Types)[], Out extends keyof Types, K extends keyof Types>(
    { port, to, index: toIndex }: { port: Port<K>, to: NodeData<In, Out>, index: number }
) => {
    const from = useSyncExternalStore(observer => port.linkedTo.subscribe(observer), () => port.linkedTo.value);
    if (!from) return null;
    return from(from => <DropDynLine width$={from.width$} from={from.position} to={to.position} toIndex={toIndex} />);
}

const DropDynLine = ({ from, hOffeset = 20, to, width$, toIndex, stroke = 'black', strokeDasharray }: { hOffeset?: number, width$?: BehaviorSubject<number>, strokeDasharray?: string, stroke?: string, from: BehaviorSubject<{ x: number, y: number }>, to: BehaviorSubject<{ x: number, y: number }>, toIndex: number }) => {
    const fromV = useSyncExternalStore(from.subscribe, () => from.value);
    const toV = useSyncExternalStore(to.subscribe, () => to.value);
    const width = useSyncExternalStore(width$?.subscribe ?? (() => () => { }), () => width$?.value ?? 0);
    console.log(width);
    
    const fromX = fromV.x + width;
    const fromY = fromV.y + hOffeset;
    const toX = toV.x;
    const toY = toV.y + 20 + toIndex * 20;

    return (
        <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke={stroke}
            strokeDasharray={strokeDasharray}
            strokeWidth={2}
        />
    );

}

const equal = (
    n1: unknown,
    n2: unknown,
) => n1 === n2
import { forwardRef, useEffect, useRef, useState, useSyncExternalStore, type ForwardedRef, type ReactNode } from "react";
import type { NodeData, SomePort, Types } from "./types";
import { createSubject, tap, type BehaviorSubject } from "../engine/reactive";

interface NodeProps<In extends (keyof Types)[], Out extends keyof Types> {
    node: NodeData<In, Out>;
    onMove: (x: number, y: number) => void;
    onPortConnectStart: (port: SomePort<In[number]>, index: number) => void;
    onPortConnectEnd: () => boolean;
    draggingIndex: number | null
}

export function Node<In extends (keyof Types)[], Out extends keyof Types>({
    node,
    onMove,
    onPortConnectEnd,
    onPortConnectStart,
    draggingIndex
}: NodeProps<In, Out>) {

    const { Component } = node.config
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });
    const layoutRef = useRef<HTMLDivElement>(null)
    const [hot, setHot] = useState(false);
    const [highlighted, setHighlighted] = useState(false);

    useEffect(() => {
        const result = tap(node.result, () => {
            setHighlighted(true);
            setTimeout(() => {
                setHighlighted(false);
            }, 300);
        })
        if (hot) {
            const next = createSubject<Types[Out]>()
            node._next.emit(next)
            return result.subscribe(next.emit);
        } else {
            node._next.emit(result)
        }
    }, [hot, node])

    // track layout size using dom
    useEffect(() => {
        if (!layoutRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                node.width$.emit(entry.borderBoxSize[0].inlineSize);
            }
        });
        observer.observe(layoutRef.current);
        return () => observer.disconnect();
    }, [node.width$]);


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // if click happened on a port, ignore drag
        const target = e.target as HTMLElement;
        if (target.classList.contains("port")) return;
        e.preventDefault();
        if (onPortConnectEnd()) return

        setDragging(true);
        offset.current = {
            x: e.clientX - node.position.value.x,
            y: e.clientY - node.position.value.y,
        };
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = e.clientX - offset.current.x;
            const newY = e.clientY - offset.current.y;
            onMove(newX, newY);
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, onMove]);
    return (

        <Layout
            onMouseDown={handleMouseDown}
            highlighted={highlighted}
            pos={node.position}
            ref={layoutRef}
        >
            <label className="absolute top-[-20px] left-0 text-xs text-gray-500">
                <input type="checkbox"
                    className="pr-2 mr-1"
                    checked={hot}
                    onChange={(e) => {
                        setHot(e.target.checked);
                        if (!e.target.checked) {
                            node._next.emit(node.result);
                        }
                    }}
                />
                HOT
            </label>

            {Component && <Component node={node} />}
            {node.label}
            {node.inputs?.map((port, i) => port(port => (
                <div
                    key={port.id}
                    onMouseUp={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onPortConnectStart(c => c(port), i);
                    }}
                    className={draggingIndex !== i && port.linkedTo.value === null 
                        ? "port absolute left-[-6px] w-3 h-3 rounded-full bg-green-500 cursor-crosshair" 
                        : "port absolute left-[-6px] w-3 h-3 rounded-full border-dashed border-1 border-green-500 cursor-crosshair"}
                    style={{ top: `${14 + i * 20}px` }}
                />
            )))}

            {/* <div
                onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onPortConnectStart(node.id, "output");
                }}
                className="port w-3 h-3 bg-blue-500 rounded-full absolute right-[-6px] top-1/2 -translate-y-1/2 cursor-crosshair"
            ></div>
            <div
                onMouseUp={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onPortConnectEnd(node.id, "input");
                }}
                className="port w-3 h-3 bg-green-500 rounded-full absolute left-[-6px] top-1/2 -translate-y-1/2 cursor-crosshair"
            ></div> */}
        </Layout>
    );
}

const Layout = forwardRef(({ children, onMouseDown, pos, highlighted }: {
    highlighted: boolean, pos: BehaviorSubject<{ x: number, y: number }>,
    children: ReactNode, onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}, ref: ForwardedRef<HTMLDivElement>) => {
    const node = useSyncExternalStore(pos.subscribe, () => pos.value)
    return (
        <div
            ref={ref}
            onMouseDown={onMouseDown}
            className={"absolute px-4 py-2 bg-white border rounded shadow cursor-move select-none transition-all " + (highlighted ? "border-red-500" : "border-gray-300")}
            style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
            }}
        >
            {children}
        </div>
    );
})
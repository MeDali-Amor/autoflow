import { useEffect, useRef, useState } from "react";
import type { NodeData } from "./types";

interface NodeProps<T> {
    node: NodeData<T>;
    onMove: (id: string, x: number, y: number) => void;
    onPortConnectStart: (nodeId: string, portId: string) => void;
    onPortConnectEnd: (nodeId: string, portId: string) => void;
    trigger?: () => void;
}

export function Node<T>({
    node,
    onMove,
    onPortConnectEnd,
    onPortConnectStart,
    trigger,
}: NodeProps<T>) {
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // if click happened on a port, ignore drag
        const target = e.target as HTMLElement;
        if (target.classList.contains("port")) return;
        e.preventDefault();
        setDragging(true);
        offset.current = {
            x: e.clientX - node.x,
            y: e.clientY - node.y,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const newX = e.clientX - offset.current.x;
            const newY = e.clientY - offset.current.y;
            onMove(node.id, newX, newY);
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
    }, [dragging, node.id, onMove]);
    return (
        <div
            onMouseDown={handleMouseDown}
            className="absolute px-4 py-2 bg-white border rounded shadow cursor-move select-none"
            style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
            }}
        >
            {node.type === "Trigger" && (
                <button
                    onClick={() => {
                        // const val = Math.floor(Math.random() * 100);
                        trigger?.();
                    }}
                    className="mt-2 text-xs text-white bg-blue-500 px-2 py-1 rounded"
                >
                    ▶ Trigger
                </button>
            )}
            {node.label}
            {node.inputs?.map((port, i) => (
                <div
                    key={port.id}
                    onMouseUp={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onPortConnectEnd(node.id, port.id);
                    }}
                    className="port absolute left-[-6px] w-3 h-3 rounded-full bg-green-500 cursor-crosshair"
                    style={{ top: `${20 + i * 20}px` }}
                />
            ))}

            {node.outputs?.map((port, i) => (
                <div
                    key={port.id}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onPortConnectStart(node.id, port.id);
                    }}
                    className="port absolute right-[-6px] w-3 h-3 rounded-full bg-blue-500 cursor-crosshair"
                    style={{ top: `${20 + i * 20}px` }}
                />
            ))}
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
        </div>
    );
}

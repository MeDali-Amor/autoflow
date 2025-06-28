import {
    forwardRef,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ForwardedRef,
    type ReactNode,
} from "react";
import type { NodeData, SomePort, Types } from "./types";
import { createSubject, tap, type BehaviorSubject } from "../engine/reactive";

interface NodeProps<In extends (keyof Types)[], Out extends keyof Types> {
    node: NodeData<In, Out>;
    onMove: (x: number, y: number) => void;
    onPortConnectStart: (port: SomePort<In[number]>, index: number) => void;
    onPortConnectEnd: () => boolean;
    draggingIndex: number | null;
}

export function Node<In extends (keyof Types)[], Out extends keyof Types>({
    node,
    onMove,
    onPortConnectEnd,
    onPortConnectStart,
    draggingIndex,
}: NodeProps<In, Out>) {
    const { Component } = node.config;
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });
    const layoutRef = useRef<HTMLDivElement>(null);
    const [hot, setHot] = useState(false);
    const [highlighted, setHighlighted] = useState(false);

    useEffect(() => {
        const result = tap(node.result, () => {
            setHighlighted(true);
            setTimeout(() => {
                setHighlighted(false);
            }, 300);
        });
        if (hot) {
            const next = createSubject<Types[Out]>();
            node._next.emit(next);
            return result.subscribe(next.emit);
        } else {
            node._next.emit(result);
        }
    }, [hot, node]);

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
            onMouseUp={(e) => {
                if (onPortConnectEnd()) {
                    e.stopPropagation();
                }
            }}
            highlighted={highlighted}
            pos={node.position}
            ref={layoutRef}
            type={node.config.type}
        >
            <label className="absolute top-[-20px] left-0 text-xs text-gray-500">
                <input
                    type="checkbox"
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
            {node.inputs?.map((port, i) =>
                port((port) => {
                    const color = { number: "blue", string: "red" }[port.type];
                    return (
                        <div
                            key={port.id}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPortConnectStart((c) => c(port), i);
                            }}
                            className={
                                "port absolute left-[-6px] w-3 h-3 rounded-full cursor-crosshair " +
                                (draggingIndex === i
                                    ? `border-dashed border-1 border-${color}-500`
                                    : port.linkedTo.value !== null
                                    ? `border-1 border-${color}-500`
                                    : `bg-${color}-500`)
                            }
                            style={{ top: `${14 + i * 20}px` }}
                        />
                    );
                })
            )}
        </Layout>
    );
}

const Layout = forwardRef(
    (
        {
            children,
            onMouseDown,
            onMouseUp,
            pos,
            highlighted,
            type,
        }: {
            highlighted: boolean;
            pos: BehaviorSubject<{ x: number; y: number }>;
            children: ReactNode;
            onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
            onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
            type: keyof Types;
        },
        ref: ForwardedRef<HTMLDivElement>
    ) => {
        const node = useSyncExternalStore(pos.subscribe, () => pos.value);
        const color = { number: "blue", string: "red" }[type];
        return (
            <div
                ref={ref}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                className={`absolute px-4 py-2 border rounded shadow cursor-move select-none transition-bg border-${color}-500 ${
                    highlighted ? `bg-${color}-200` : "bg-white"
                }`}
                style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                }}
            >
                {children}
            </div>
        );
    }
);

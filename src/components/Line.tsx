"use client";
import { useSyncExternalStore } from "react";
import { type BehaviorSubject } from "../engine/reactive";
import type { NodeData, Port, Types } from "./types";

export const DrowPortLine = <In extends (keyof Types)[], Out extends keyof Types, K extends keyof Types>(
    { port, to, index: toIndex }: { port: Port<K>, to: NodeData<In, Out>, index: number }
) => {
    const from = useSyncExternalStore(observer => port.linkedTo.subscribe(observer), () => port.linkedTo.value);
    if (!from) return null;
    return from(from => <DropDynLine width$={from.width$} from={from.position} to={to.position} toIndex={toIndex} />);
}

export const DropDynLine = ({ from, hOffeset = 20, to, width$, toIndex, stroke = 'black', strokeDasharray }: { hOffeset?: number, width$?: BehaviorSubject<number>, strokeDasharray?: string, stroke?: string, from: BehaviorSubject<{ x: number, y: number }>, to: BehaviorSubject<{ x: number, y: number }>, toIndex: number }) => {
    const fromV = useSyncExternalStore(from.subscribe, () => from.value);
    const toV = useSyncExternalStore(to.subscribe, () => to.value);
    const width = useSyncExternalStore(width$?.subscribe ?? (() => () => { }), () => width$?.value ?? 0);

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

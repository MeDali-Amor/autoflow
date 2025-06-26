import { useEffect, useState, type ReactNode } from "react";
import type { NodeData, Types } from "./types";
import type { Observable } from "../engine/reactive";

export const LogHOC = (messages$: Observable<ReactNode>) => {
    const Log = <In extends (keyof Types)[], Out extends keyof Types>({ node }: { node: NodeData<In, Out> }) => {
        const [history, setHistory] = useState<ReactNode[]>([]);
        useEffect(() => {
            return messages$.subscribe(value => {
                setHistory(hist => [value, ...hist].slice(0, 10))
            });
        }, [node.next]);
        return (
            <div className="log-node" style={{ height: '100px', width: '100px', display: 'block', overflowY: 'scroll' }}>
                <ul>
                    {history.map((value, index) => (
                        <li key={index}>{value}</li>
                    ))}
                </ul>
            </div>
        );
    }
    return Log
}
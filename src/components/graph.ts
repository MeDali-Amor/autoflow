"use client";
import { v4 as uuid } from "uuid";
import { createBehaviorSubject, NEVER, switchMap, type Observable } from "../engine/reactive";
import type { MapPort, MapTypeObservable, NodeConfig, NodeData, SomeNodeData, Types } from "./types";


export const instanciate = <In extends (keyof Types)[], Out extends keyof Types>(config: NodeConfig<In, Out>, label: string, { x, y }: { x: number, y: number }): NodeData<In, Out> => {
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
    return {
        id: uuid(),
        position: createBehaviorSubject({ x, y }),
        config,
        inputs: inputs as MapPort<In>,
        width$: createBehaviorSubject(0),
        label: label,
        result: out,
        _next,
        next: switchMap(_next, v => v)
    }

}

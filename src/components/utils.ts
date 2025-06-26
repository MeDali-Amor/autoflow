import { combineLatest, createSubject, filter, map, merge, scan, tap } from "../engine/reactive";
import { Log } from "./Log";
import { TriggerHOC } from "./Trigger";
import type { SomeNodeConfig } from "./types";


export const nodeVariantsMap: Record<
    string,
    SomeNodeConfig
> = {
    Trigger: c => {
        const clicks$ = createSubject<void>()
        return c({
            inputTypes: [],
            operator: () => map(clicks$, () => 1),
            Component: TriggerHOC(clicks$),
            type: 'number'
        })
    },
    STrigger: c => {
        const clicks$ = createSubject<void>()
        return c({
            inputTypes: [],
            operator: () => map(clicks$, () => "1"),
            Component: TriggerHOC(clicks$),
            type: 'string'
        })
    },
    Map: c => c({
        inputTypes: ['number'] as const,
        operator: (x) => map(x, (value) => value * 10),
        type: 'number'
    }),
    Filter: c => c({
        inputTypes: ['number'] as const,
        operator: (x) => filter(x, (value) => value > 40),
        type: 'number'
    }),
    Scan: c => c({
        inputTypes: ['number'] as const,
        operator: (x) => scan(x, (acc: number, x) => acc + x, 0),
        type: 'number'
    }),
    Log: c => c({
        inputTypes: ['number'] as const,
        operator: (x) => tap(x, console.log),
        type: 'number',
        Component: Log
    }),
    SLog: c => c({
        inputTypes: ['string'] as const,
        operator: (x) => tap(x, console.log),
        type: 'string',
        Component: Log
    }),
    Merge: c => c({
        inputTypes: ['number', 'number'] as const,
        operator: (x, y) => merge(x, y),
        type: 'number'
    }),
    Combine: c => c({
        inputTypes: ['number', 'number'] as const,
        operator: (x, y) => combineLatest([x, y], (x, y) => x + y),
        type: 'number'
    }),
    SCombine: c => c({
        inputTypes: ['string', 'number'] as const,
        operator: (x, y) => combineLatest([x, y], (x, y) => x + y),
        type: 'string',
    }),
};

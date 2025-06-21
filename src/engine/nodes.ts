import {
    combineLatest,
    createObservable,
    filter,
    map,
    scan,
    tap,
    type Observable,
} from "./reactive";

export function createTrigger<T>() {
    const stream = createObservable<T>();
    return {
        stream,
        trigger: (val: T) => stream.emit(val),
    };
}

export function createMapNode<I, O>(
    input$: Observable<I>,
    fn: (input: I) => O
): Observable<O> {
    return map(input$, fn);
}
export function createScanNode<I, O>(
    input$: Observable<I>,
    accumulator: (acc: O, nextVal: I) => O,
    seed: O
): Observable<O> {
    return scan(input$, accumulator, seed);
}

export function createFilterNode<T>(
    input$: Observable<T>,
    predicate: (value: T) => boolean
): Observable<T> {
    return filter(input$, predicate);
}

export function createDebugNode<T>(
    input$: Observable<T>,
    label: string = "Debug"
): Observable<T> {
    return tap(input$, (val) => console.log(`[DEBUG NODE ${label}]`, val));
}

export function createMergeNode<T>(
    inputA$: Observable<T>,
    inputB$: Observable<T>
): Observable<T> {
    return {
        subscribe: (subscriber) => {
            const unsubA = inputA$.subscribe(subscriber);
            const unsubB = inputB$.subscribe(subscriber);

            return () => {
                unsubA();
                unsubB();
            };
        },
    };
}

export function createCombineNode<A, B, R>(
    inputA$: Observable<A>,
    inputB$: Observable<B>,
    combiner: (a: A, b: B) => R
): Observable<R> {
    return combineLatest(inputA$, inputB$, combiner);
}

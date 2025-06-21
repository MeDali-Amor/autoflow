export type Subscriber<T> = (value: T) => void;

export interface Observable<T> {
    subscribe: (subscriber: Subscriber<T>) => () => void;
}

export interface Subject<T> extends Observable<T> {
    emit: (value: T) => void;
}

export function createObservable<T>(): Subject<T> {
    const subscribers = new Set<Subscriber<T>>();

    const subscribe = (subscriber: Subscriber<T>) => {
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber); // unsubscribe function
    };

    const emit = (value: T) => {
        for (const sub of subscribers) {
            sub(value);
        }
    };

    return { subscribe, emit };
}

export function map<A, B>(
    source: Observable<A>,
    fn: (value: A) => B
): Observable<B> {
    return {
        subscribe: (subscriber) =>
            source.subscribe((value) => {
                subscriber(fn(value));
            }),
    };
}

export function filter<T>(
    source: Observable<T>,
    predicate: (value: T) => boolean
): Observable<T> {
    return {
        subscribe: (subscriber) =>
            source.subscribe((value) => {
                if (predicate(value)) {
                    subscriber(value);
                }
            }),
    };
}

export function tap<T>(
    source: Observable<T>,
    effect: (value: T) => void
): Observable<T> {
    return {
        subscribe: (subscriber) =>
            source.subscribe((value) => {
                effect(value);
                subscriber(value);
            }),
    };
}

export function scan<A, B>(
    source: Observable<A>,
    accumulator: (acc: B, value: A) => B,
    seed: B
): Observable<B> {
    return {
        subscribe: (subscriber) => {
            let acc = seed;
            return source.subscribe((value) => {
                acc = accumulator(acc, value);
                subscriber(acc);
            });
        },
    };
}
export function combineLatest<A, B, R>(
    inputA: Observable<A>,
    inputB: Observable<B>,
    combiner: (a: A, b: B) => R
): Observable<R> {
    return {
        subscribe: (subscriber) => {
            let aSet = false,
                bSet = false;
            let latestA: A;
            let latestB: B;

            const subA = inputA.subscribe((a) => {
                latestA = a;
                aSet = true;
                if (bSet) subscriber(combiner(latestA, latestB));
            });

            const subB = inputB.subscribe((b) => {
                latestB = b;
                bSet = true;
                if (aSet) subscriber(combiner(latestA, latestB));
            });

            return () => {
                subA();
                subB();
            };
        },
    };
}
export function merge<A>(a$: Observable<A>, b$: Observable<A>): Observable<A> {
    return {
        subscribe: (subscriber) => {
            const unsubA = a$.subscribe(subscriber);
            const unsubB = b$.subscribe(subscriber);
            return () => {
                unsubA();
                unsubB();
            };
        },
    };
}

// export type Operator<I, O> = (input: Observable<I>) => Observable<O>;

// export function pipe<T>(input: Observable<T>): Observable<T>;
// export function pipe<T, A>(
//     input: Observable<T>,
//     op1: Operator<T, A>
// ): Observable<A>;
// export function pipe<T, A, B>(
//     input: Observable<T>,
//     op1: Operator<T, A>,
//     op2: Operator<A, B>
// ): Observable<B>;
// export function pipe<T, A, B, C>(
//     input: Observable<T>,
//     op1: Operator<T, A>,
//     op2: Operator<A, B>,
//     op3: Operator<B, C>
// ): Observable<C>;
// // Add more overloads as needed

// export function pipe<T, R>(
//     input: Observable<T>,
//     ...fns: Array<Operator<any, any>>
// ): Observable<R> {
//     return fns.reduce((prev, fn) => fn(prev), input) as Observable<R>;
// }

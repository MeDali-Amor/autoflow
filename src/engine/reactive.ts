export type Subscriber<T> = (value: T) => void;

export interface Observable<T> {
    subscribe: (subscriber: Subscriber<T>) => () => void;
}

export interface Subject<T> extends Observable<T> {
    emit: (value: T) => void;
}
export interface BehaviorSubject<T> extends Subject<T> {
    get value(): T;
}


export const NEVER: Observable<never> = ({
    subscribe: () => () => {}, // no-op unsubscribe
});

export function createSubject<T>(): Subject<T> {
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
export function createBehaviorSubject<T>(init: T): BehaviorSubject<T> {
    const subject = createSubject<T>()
    return { subscribe: subject.subscribe, emit: v => subject.emit(init = v), get value() { return init } };
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

export function switchMap<A, B>(
    source: BehaviorSubject<A>,
    fn: (value: A) => Observable<B>
): Observable<B> {
    return {
        subscribe: (subscriber) => {
            let innerUnsub = fn(source.value).subscribe(subscriber);

            const outerUnsub = source.subscribe((value) => {
                innerUnsub();
                innerUnsub = fn(value).subscribe(subscriber);
            });

            return () => {
                outerUnsub();
                innerUnsub();
            };
        },
    };
}

export function filter<T, X extends T>(
    source: Observable<T>,
    predicate: (value: T) => value is X
): Observable<X>
export function filter<T>(
    source: Observable<T>,
    predicate: (value: T) => boolean
): Observable<T>
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

export type MapObservable<A extends unknown[]> = {
    [X in keyof A]: Observable<A[X]>
}


export function combineLatest<A extends unknown[], R>(
    inputs: MapObservable<A>,
    combiner: (...a: A) => R
): Observable<R> {
    return {
        subscribe: (subscriber) => {
            const set = new Array(inputs.length).fill(false);
            const latests = new Array(inputs.length) as A;
            const subs = inputs.map((input, index) =>
                input.subscribe((value) => {
                    latests[index] = value;
                    set[index] = true;
                    if (set.every(Boolean)) {
                        subscriber(combiner(...latests));
                    }
                })
            );

            return () => {
                for (const unsub of subs) {
                    unsub();
                }
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

export type Operator<I, O> = (input: Observable<I>) => Observable<O>;

export function pipe<T>(input: Observable<T>): Observable<T>;
export function pipe<T, A>(
    input: Observable<T>,
    op1: Operator<T, A>
): Observable<A>;
export function pipe<T, A, B>(
    input: Observable<T>,
    op1: Operator<T, A>,
    op2: Operator<A, B>
): Observable<B>;
export function pipe<T, A, B, C>(
    input: Observable<T>,
    op1: Operator<T, A>,
    op2: Operator<A, B>,
    op3: Operator<B, C>
): Observable<C>;
// Add more overloads as needed

export function pipe<T>(
    input: Observable<T>,
    ...fns: Array<Operator<T, T>>
): Observable<T> {
    return fns.reduce((prev, fn) => fn(prev), input);
}

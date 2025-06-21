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

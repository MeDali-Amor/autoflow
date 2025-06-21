import type { Observable, Subscriber } from "./reactive";

export interface GraphConnection<I, O> {
    from: Observable<I>;
    to: Subscriber<O>;
    transform: (input: I) => O;
}

export function connectGraphConnection<I, O>(
    from: Observable<I>,
    to: Subscriber<O>,
    transform: (input: I) => O
): () => void {
    return from.subscribe((val: I) => {
        const out = transform(val);
        to(out);
    });
}

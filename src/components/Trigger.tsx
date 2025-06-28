import { type Subject } from "../engine/reactive";

export const TriggerHOC = (click$: Subject<void>) => () => {
    return <button
        onClick={() => click$.emit()}
        className="mt-2 text-xs text-white bg-blue-500 px-2 py-1 rounded"
    >
        ▶ Trigger
    </button>

}

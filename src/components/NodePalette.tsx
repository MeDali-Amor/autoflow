import type { NodeKind } from "../engine/types";
import type { NodeType } from "./types";
import { nodeVariantsMap } from "./utils";

interface PaletteItemProps<T> {
    type: NodeKind;
    onDragStart: (type: NodeKind) => void;
    config?: NodeType<T>["config"];
}

function PaletteItem<T>({ type, onDragStart }: PaletteItemProps<T>) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(type)}
            className="cursor-grab px-4 py-2 rounded bg-blue-100 border mb-2 text-sm shadow"
        >
            ➕ {type}
        </div>
    );
}

export function NodePalette({
    onDragStart,
}: {
    onDragStart: (type: NodeKind) => void;
}) {
    const nodeVariants = Object.values(nodeVariantsMap) as NodeType<number>[];
    return (
        <div className="p-4 bg-gray-200 w-48 border-r h-full overflow-y-auto">
            <h2 className="text-md font-semibold mb-4">Node Types</h2>
            {nodeVariants.map((variant) => (
                <PaletteItem
                    key={variant.type}
                    type={variant.type}
                    config={variant.config}
                    onDragStart={onDragStart}
                />
            ))}
        </div>
    );
}

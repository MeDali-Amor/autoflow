import type { NodeType } from "./node-types";

interface PaletteItemProps {
    type: NodeType;
    onDragStart: (type: NodeType) => void;
}

function PaletteItem({ type, onDragStart }: PaletteItemProps) {
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
    onDragStart: (type: NodeType) => void;
}) {
    const types: NodeType[] = ["Trigger", "Map", "Filter", "Log", "Scan"];

    return (
        <div className="p-4 bg-gray-200 w-48 border-r h-full overflow-y-auto">
            <h2 className="text-md font-semibold mb-4">Node Types</h2>
            {types.map((type) => (
                <PaletteItem key={type} type={type} onDragStart={onDragStart} />
            ))}
        </div>
    );
}

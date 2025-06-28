import type { NodeConfig, SomeNodeConfig, Types } from "./types";
import { nodeVariantsMap } from "./utils";

interface PaletteItemProps<In extends (keyof Types)[], Out extends keyof Types> {
    label: string;
    onDragStart: (label: string) => void;
    config: NodeConfig<In, Out>;
}

function PaletteItem<In extends (keyof Types)[], Out extends keyof Types>({ label, onDragStart }: PaletteItemProps<In, Out>) {
    return (
        <div
            draggable
            onDragStart={()=>onDragStart(label)}
            className="cursor-grab px-4 py-2 rounded bg-blue-100 border mb-2 text-sm shadow"
        >
            ➕ {label}
        </div>
    );
}

export function NodePalette({
    onDragStart,
}: {
    onDragStart: (type: SomeNodeConfig, label: string) => void;
}) {
    const nodeVariants = Object.entries(nodeVariantsMap);
    return (
        <div className="p-4 bg-gray-200 w-48 border-r h-full overflow-y-auto">
            <h2 className="text-md font-semibold mb-4">Node Types</h2>
            {nodeVariants.map(([name, variant], i) => variant(
                variant => <PaletteItem
                    key={i}
                    label={name}
                    config={variant}
                    onDragStart={(label) => onDragStart(c=>c(variant), label)}
                />
            ))}
        </div>
    );
}

import React from 'react';

// Entity structure for DXF components
interface Entity {
  type: string;
  [key: string]: any;
}

interface FileComponentTreeProps {
  filePath: string | null;
}

export default function FileComponentTree({ filePath }: FileComponentTreeProps) {
  const [treeData, setTreeData] = React.useState<Record<string, Entity[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    window.electron
      .parseDXFTree(filePath)
      .then((result: string) => {
        try {
          const data = JSON.parse(result);
          setTreeData(data);
        } catch {
          setError('Failed to parse DXF tree data.');
        }
      })
      .catch((err: any) => {
        setError(err.toString());
      })
      .finally(() => setLoading(false));
  }, [filePath]);

  if (!filePath) {
    return <div className="text-gray-500">No DXF file loaded.</div>;
  }
  if (loading) {
    return <div className="text-gray-500">Loading component tree...</div>;
  }
  if (error) {
    return <div className="text-red-500">Error loading component tree: {error}</div>;
  }

  // Build nested cascading dropdown: File > Layers > Feature Types > Features
  const layers = Object.entries(treeData);
  if (layers.length === 0) {
    return <div className="text-gray-500">No components found in DXF file.</div>;
  }
  // Derive filename from path for top-level dropdown
  const fileName = filePath ? filePath.replace(/^.*[\\/]/, '') : 'DXF File';
  // Helper to group entities by type
  const groupByType = (entities: Entity[]): Record<string, Entity[]> =>
    entities.reduce((acc, ent) => {
      const t = ent.type || 'Unknown';
      (acc[t] = acc[t] || []).push(ent);
      return acc;
    }, {} as Record<string, Entity[]>);
  return (
    <div className="text-sm text-gray-200 overflow-auto">
      <details open className="mb-2">
        <summary className="cursor-pointer font-bold hover:text-white">{fileName}</summary>
        {layers.map(([layer, entities]) => {
          const typesMap = groupByType(entities);
          return (
            <details key={layer} className="ml-4 mb-1">
              <summary className="cursor-pointer hover:text-white">
                {layer} ({entities.length})
              </summary>
              {Object.entries(typesMap).map(([type, ents]) => (
                <details key={type} className="ml-4 mb-1">
                  <summary className="cursor-pointer italic hover:text-white">
                    {type} ({ents.length})
                  </summary>
                  <ul className="ml-4 list-decimal">
                    {ents.map((entity, idx) => (
                      <li key={idx} className="mb-1">
                        <details className="ml-2">
                          <summary className="font-mono">Feature {idx + 1}</summary>
                          <ul className="ml-4 list-disc text-xs">
                            {Object.entries(entity).map(([k, v]) => (
                              <li key={k}>
                                <span className="font-semibold">{k}</span>: <span className="font-mono">{JSON.stringify(v)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </details>
          );
        })}
      </details>
    </div>
  );
}
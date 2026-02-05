import type { OpenAPIParameter, OpenAPISchema, OpenAPISpec } from '@/types/openapi';
import { resolveSchema, getSchemaName } from '@/utils/openApiParser';
import { motion } from 'framer-motion';

interface ParameterTableProps {
  parameters: OpenAPIParameter[];
  title: string;
}

export function ParameterTable({ parameters, title }: ParameterTableProps) {
  if (parameters.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param, index) => (
              <motion.tr
                key={param.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-foreground">{param.name}</code>
                    {param.required && (
                      <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                        required
                      </span>
                    )}
                    {param.deprecated && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded line-through">
                        deprecated
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {param.schema?.type || 'any'}
                    {param.schema?.enum && ` (${param.schema.enum.join(' | ')})`}
                  </code>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {param.description || '-'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SchemaViewerProps {
  schema: OpenAPISchema;
  spec: OpenAPISpec;
  title?: string;
  depth?: number;
}

export function SchemaViewer({ schema, spec, title, depth = 0 }: SchemaViewerProps) {
  const resolved = resolveSchema(spec, schema);
  if (!resolved) return null;

  const renderSchema = (s: OpenAPISchema, d: number): React.ReactNode => {
    const res = resolveSchema(spec, s);
    if (!res) return null;

    if (res.type === 'object' && res.properties) {
      return (
        <div className={d > 0 ? 'ml-4 border-l-2 border-border pl-4' : ''}>
          {Object.entries(res.properties).map(([key, prop]) => {
            const propResolved = resolveSchema(spec, prop);
            const isRequired = res.required?.includes(key);
            
            return (
              <div key={key} className="py-2 border-b border-border/50 last:border-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <code className="font-mono text-sm text-foreground">{key}</code>
                  {isRequired && (
                    <span className="text-[10px] font-medium text-destructive">required</span>
                  )}
                  <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {getSchemaName(prop)}
                  </code>
                </div>
                {propResolved?.description && (
                  <p className="text-xs text-muted-foreground mt-1">{propResolved.description}</p>
                )}
                {propResolved?.type === 'object' && propResolved.properties && d < 3 && (
                  renderSchema(propResolved, d + 1)
                )}
                {propResolved?.type === 'array' && propResolved.items && d < 3 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Array items:</span>
                    {renderSchema(propResolved.items, d + 1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (res.type === 'array' && res.items) {
      return (
        <div className="py-2">
          <span className="text-xs text-muted-foreground">Array of:</span>
          {renderSchema(res.items, d + 1)}
        </div>
      );
    }

    return (
      <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
        {getSchemaName(res)}
      </code>
    );
  };

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-foreground">{title}</h4>}
      <div className="rounded-lg border border-border p-4 bg-muted/30">
        {renderSchema(resolved, depth)}
      </div>
    </div>
  );
}

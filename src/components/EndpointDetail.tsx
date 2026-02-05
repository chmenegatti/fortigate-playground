import { motion } from 'framer-motion';
import { MethodBadge } from './MethodBadge';
import { ParameterTable, SchemaViewer } from './ParameterTable';
import { CodeBlock } from './CodeBlock';
import type { ParsedEndpoint, OpenAPISpec } from '@/types/openapi';
import { generateExampleFromSchema, resolveSchema } from '@/utils/openApiParser';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface EndpointDetailProps {
  endpoint: ParsedEndpoint;
  spec: OpenAPISpec;
}

const statusCodeColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  '2': { bg: 'bg-method-get/10', text: 'text-method-get', icon: <CheckCircle className="h-4 w-4" /> },
  '3': { bg: 'bg-primary/10', text: 'text-primary', icon: <Info className="h-4 w-4" /> },
  '4': { bg: 'bg-method-put/10', text: 'text-method-put', icon: <AlertTriangle className="h-4 w-4" /> },
  '5': { bg: 'bg-destructive/10', text: 'text-destructive', icon: <XCircle className="h-4 w-4" /> },
};

function getStatusStyle(code: string) {
  const firstDigit = code.charAt(0);
  return statusCodeColors[firstDigit] || statusCodeColors['2'];
}

export function EndpointDetail({ endpoint, spec }: EndpointDetailProps) {
  const { operation, path, method, pathParameters } = endpoint;
  
  // Combine path parameters from path item and operation
  const allParameters = [...(pathParameters || []), ...(operation.parameters || [])];
  const queryParams = allParameters.filter(p => p.in === 'query');
  const headerParams = allParameters.filter(p => p.in === 'header');
  const pathParams = allParameters.filter(p => p.in === 'path');
  
  // Get request body schema
  const requestBodyContent = operation.requestBody?.content?.['application/json'];
  const requestBodySchema = requestBodyContent?.schema;
  const requestBodyExample = requestBodyContent?.example || 
    (requestBodySchema ? generateExampleFromSchema(spec, requestBodySchema) : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-6 px-6 py-4 border-b border-border">
        <div className="flex items-start gap-4 flex-wrap">
          <MethodBadge method={method} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-mono text-lg font-semibold text-foreground break-all">{path}</h2>
            {operation.summary && (
              <p className="text-muted-foreground mt-1">{operation.summary}</p>
            )}
          </div>
          {operation.deprecated && (
            <span className="px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              Deprecated
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {operation.description && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Description</h3>
          <p className="text-muted-foreground leading-relaxed">{operation.description}</p>
        </section>
      )}

      {/* Parameters */}
      {pathParams.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Path Parameters</h3>
          <ParameterTable parameters={pathParams} title="" />
        </section>
      )}

      {queryParams.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Query Parameters</h3>
          <ParameterTable parameters={queryParams} title="" />
        </section>
      )}

      {headerParams.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Headers</h3>
          <ParameterTable parameters={headerParams} title="" />
        </section>
      )}

      {/* Request Body */}
      {requestBodySchema && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
            Request Body
            {operation.requestBody?.required && (
              <span className="ml-2 text-destructive text-xs font-normal">required</span>
            )}
          </h3>
          {operation.requestBody?.description && (
            <p className="text-sm text-muted-foreground mb-4">{operation.requestBody.description}</p>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <SchemaViewer schema={requestBodySchema} spec={spec} title="Schema" />
            {requestBodyExample && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Example</h4>
                <CodeBlock 
                  code={JSON.stringify(requestBodyExample, null, 2)} 
                  language="json" 
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Responses */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Responses</h3>
        <div className="space-y-4">
          {Object.entries(operation.responses).map(([code, response]) => {
            const style = getStatusStyle(code);
            const content = response.content?.['application/json'];
            const example = content?.example || 
              (content?.schema ? generateExampleFromSchema(spec, content.schema) : null);

            return (
              <motion.div
                key={code}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border border-border overflow-hidden"
              >
                <div className={`flex items-center gap-3 px-4 py-3 ${style.bg} border-b border-border`}>
                  <span className={style.text}>{style.icon}</span>
                  <span className={`font-mono font-semibold ${style.text}`}>{code}</span>
                  <span className="text-muted-foreground text-sm">{response.description}</span>
                </div>
                {example && (
                  <div className="p-4 bg-card">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Response Body</h5>
                    <CodeBlock 
                      code={JSON.stringify(example, null, 2)} 
                      language="json" 
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

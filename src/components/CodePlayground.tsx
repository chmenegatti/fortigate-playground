import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CodeBlock } from './CodeBlock';
import { generateCode, type CodeLanguage } from '@/utils/codeGenerator';
import type { ParsedEndpoint, OpenAPISpec } from '@/types/openapi';
import { generateExampleFromSchema } from '@/utils/openApiParser';

interface CodePlaygroundProps {
  endpoint: ParsedEndpoint;
  spec: OpenAPISpec;
}

const LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
];

export function CodePlayground({ endpoint, spec }: CodePlaygroundProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [language, setLanguage] = useState<CodeLanguage>('curl');
  const [baseUrl, setBaseUrl] = useState(spec.servers?.[0]?.url || 'https://api.example.com');
  const [authToken, setAuthToken] = useState('');
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState(() => {
    const content = endpoint.operation.requestBody?.content?.['application/json'];
    const example = content?.example || 
      (content?.schema ? generateExampleFromSchema(spec, content.schema) : null);
    return example ? JSON.stringify(example, null, 2) : '';
  });

  const code = useMemo(() => 
    generateCode(language, spec, endpoint, { baseUrl, authToken }),
    [language, spec, endpoint, baseUrl, authToken]
  );

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setResponse(null);
    
    const start = performance.now();
    
    try {
      // Build URL with path parameters replaced
      let url = `${baseUrl}${endpoint.path}`;
      const pathParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])]
        .filter(p => p.in === 'path');
      
      pathParams.forEach(param => {
        const value = param.example || param.schema?.example || `{${param.name}}`;
        url = url.replace(`{${param.name}}`, String(value));
      });

      // Add query parameters
      const queryParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])]
        .filter(p => p.in === 'query');
      
      if (queryParams.length > 0) {
        const searchParams = new URLSearchParams();
        queryParams.forEach(p => {
          const value = p.example || p.schema?.example;
          if (value) searchParams.append(p.name, String(value));
        });
        const queryString = searchParams.toString();
        if (queryString) url += `?${queryString}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const options: RequestInit = {
        method: endpoint.method.toUpperCase(),
        headers,
      };

      if (requestBody && ['post', 'put', 'patch'].includes(endpoint.method)) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const time = performance.now() - start;
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({ status: res.status, data, time });
      setActiveTab('response');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Playground</h3>
        <Button
          onClick={handleExecute}
          disabled={executing}
          size="sm"
          className="gap-2"
        >
          {executing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Try it out
            </>
          )}
        </Button>
      </div>

      {/* Config */}
      <div className="p-4 space-y-3 border-b border-border bg-muted/30">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Base URL</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="font-mono text-sm h-9"
            placeholder="https://api.example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Authorization Token</label>
          <Input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            className="font-mono text-sm h-9"
            placeholder="Bearer token..."
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'request' | 'response')} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border h-10 bg-transparent p-0">
          <TabsTrigger value="request" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Request
          </TabsTrigger>
          <TabsTrigger value="response" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent relative">
            Response
            {response && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                response.status >= 200 && response.status < 300 
                  ? 'bg-method-get/20 text-method-get' 
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {response.status}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="flex-1 overflow-hidden mt-0 flex flex-col">
          {/* Language selector */}
          <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === lang.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Request body editor */}
          {['post', 'put', 'patch'].includes(endpoint.method) && (
            <div className="p-4 border-b border-border">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Request Body</label>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="font-mono text-sm min-h-[120px] resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          {/* Code snippet */}
          <div className="flex-1 overflow-auto p-4">
            <CodeBlock code={code} language={language} />
          </div>
        </TabsContent>

        <TabsContent value="response" className="flex-1 overflow-auto mt-0 p-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Request Failed</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
              </div>
            </motion.div>
          )}

          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Status */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-method-get/10 text-method-get'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {response.status >= 200 && response.status < 300 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="font-mono font-semibold">{response.status}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {response.time.toFixed(0)}ms
                </span>
              </div>

              {/* Response body */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Response Body</h4>
                <CodeBlock 
                  code={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)} 
                  language="json" 
                />
              </div>
            </motion.div>
          )}

          {!response && !error && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Click "Try it out" to execute the request</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

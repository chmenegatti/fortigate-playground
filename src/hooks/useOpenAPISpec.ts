import { useState, useCallback } from 'react';
import type { OpenAPISpec, ParsedEndpoint, ParsedTag } from '@/types/openapi';
import { parseOpenAPISpec, extractEndpoints, groupEndpointsByTag } from '@/utils/openApiParser';
import { sampleOpenAPISpec } from '@/data/sampleSpec';

export function useOpenAPISpec() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(sampleOpenAPISpec);
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>(() => 
    extractEndpoints(sampleOpenAPISpec)
  );
  const [tags, setTags] = useState<ParsedTag[]>(() => 
    groupEndpointsByTag(sampleOpenAPISpec, extractEndpoints(sampleOpenAPISpec))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSpec = useCallback((content: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const parsed = parseOpenAPISpec(content);
      const parsedEndpoints = extractEndpoints(parsed);
      const parsedTags = groupEndpointsByTag(parsed, parsedEndpoints);
      
      setSpec(parsed);
      setEndpoints(parsedEndpoints);
      setTags(parsedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse spec');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromUrl = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const content = await response.text();
      loadSpec(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spec');
      setLoading(false);
    }
  }, [loadSpec]);

  const loadFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      loadSpec(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, [loadSpec]);

  const resetToSample = useCallback(() => {
    const parsedEndpoints = extractEndpoints(sampleOpenAPISpec);
    const parsedTags = groupEndpointsByTag(sampleOpenAPISpec, parsedEndpoints);
    setSpec(sampleOpenAPISpec);
    setEndpoints(parsedEndpoints);
    setTags(parsedTags);
    setError(null);
  }, []);

  return {
    spec,
    endpoints,
    tags,
    loading,
    error,
    loadSpec,
    loadFromUrl,
    loadFromFile,
    resetToSample,
  };
}

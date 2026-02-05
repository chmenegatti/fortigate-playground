import yaml from 'js-yaml';
import type { OpenAPISpec, ParsedEndpoint, ParsedTag, HttpMethod, OpenAPISchema } from '@/types/openapi';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

export function parseOpenAPISpec(content: string): OpenAPISpec {
  let spec: OpenAPISpec;
  
  try {
    spec = JSON.parse(content);
  } catch {
    try {
      spec = yaml.load(content) as OpenAPISpec;
    } catch {
      throw new Error('Failed to parse spec. Please provide valid JSON or YAML.');
    }
  }
  
  if (!spec.openapi || !spec.paths) {
    throw new Error('Invalid OpenAPI spec. Missing required fields.');
  }
  
  return spec;
}

export function extractEndpoints(spec: OpenAPISpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  
  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    HTTP_METHODS.forEach(method => {
      const operation = pathItem[method];
      if (operation) {
        endpoints.push({
          id: `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
          path,
          method,
          operation,
          pathParameters: pathItem.parameters,
        });
      }
    });
  });
  
  return endpoints;
}

export function groupEndpointsByTag(spec: OpenAPISpec, endpoints: ParsedEndpoint[]): ParsedTag[] {
  const tagMap = new Map<string, ParsedTag>();
  const tagDescriptions = new Map<string, string>();
  
  // Get tag descriptions from spec
  spec.tags?.forEach(tag => {
    tagDescriptions.set(tag.name, tag.description || '');
  });
  
  // Group endpoints by tag
  endpoints.forEach(endpoint => {
    const tags = endpoint.operation.tags || ['Untagged'];
    
    tags.forEach(tagName => {
      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, {
          name: tagName,
          description: tagDescriptions.get(tagName),
          endpoints: [],
        });
      }
      tagMap.get(tagName)!.endpoints.push(endpoint);
    });
  });
  
  return Array.from(tagMap.values());
}

export function resolveRef(spec: OpenAPISpec, ref: string): OpenAPISchema | undefined {
  if (!ref.startsWith('#/')) return undefined;
  
  const parts = ref.slice(2).split('/');
  let current: any = spec;
  
  for (const part of parts) {
    current = current?.[part];
    if (!current) return undefined;
  }
  
  return current as OpenAPISchema;
}

export function resolveSchema(spec: OpenAPISpec, schema: OpenAPISchema | undefined): OpenAPISchema | undefined {
  if (!schema) return undefined;
  
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    return resolved ? resolveSchema(spec, resolved) : undefined;
  }
  
  return schema;
}

export function generateExampleFromSchema(spec: OpenAPISpec, schema: OpenAPISchema | undefined): any {
  if (!schema) return null;
  
  const resolved = resolveSchema(spec, schema);
  if (!resolved) return null;
  
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  
  switch (resolved.type) {
    case 'string':
      if (resolved.enum) return resolved.enum[0];
      if (resolved.format === 'date') return '2024-01-15';
      if (resolved.format === 'date-time') return '2024-01-15T10:30:00Z';
      if (resolved.format === 'email') return 'user@example.com';
      if (resolved.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
      if (resolved.format === 'uri') return 'https://example.com';
      return 'string';
    case 'number':
    case 'integer':
      return resolved.enum ? resolved.enum[0] : 0;
    case 'boolean':
      return true;
    case 'array':
      const itemExample = generateExampleFromSchema(spec, resolved.items);
      return itemExample ? [itemExample] : [];
    case 'object':
      if (resolved.properties) {
        const obj: Record<string, any> = {};
        Object.entries(resolved.properties).forEach(([key, propSchema]) => {
          obj[key] = generateExampleFromSchema(spec, propSchema);
        });
        return obj;
      }
      return {};
    default:
      if (resolved.oneOf?.[0]) return generateExampleFromSchema(spec, resolved.oneOf[0]);
      if (resolved.anyOf?.[0]) return generateExampleFromSchema(spec, resolved.anyOf[0]);
      if (resolved.allOf) {
        const merged: Record<string, any> = {};
        resolved.allOf.forEach(subSchema => {
          const example = generateExampleFromSchema(spec, subSchema);
          if (example && typeof example === 'object') {
            Object.assign(merged, example);
          }
        });
        return merged;
      }
      return null;
  }
}

export function getSchemaName(schema: OpenAPISchema | undefined): string {
  if (!schema) return 'unknown';
  if (schema.$ref) {
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1];
  }
  if (schema.type === 'array' && schema.items) {
    return `${getSchemaName(schema.items)}[]`;
  }
  return schema.type || 'unknown';
}

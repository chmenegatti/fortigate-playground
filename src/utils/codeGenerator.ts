import type { ParsedEndpoint, OpenAPISpec, OpenAPIParameter } from '@/types/openapi';
import { generateExampleFromSchema, resolveSchema } from './openApiParser';

export type CodeLanguage = 'curl' | 'javascript' | 'python' | 'go';

interface GeneratorOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  authToken?: string;
}

function getRequestBody(spec: OpenAPISpec, endpoint: ParsedEndpoint): any {
  const content = endpoint.operation.requestBody?.content;
  if (!content) return null;
  
  const jsonContent = content['application/json'];
  if (jsonContent?.example) return jsonContent.example;
  if (jsonContent?.schema) {
    return generateExampleFromSchema(spec, jsonContent.schema);
  }
  return null;
}

function buildUrl(baseUrl: string, path: string, params?: OpenAPIParameter[]): string {
  let url = `${baseUrl}${path}`;
  
  // Replace path parameters with example values
  const pathParams = params?.filter(p => p.in === 'path') || [];
  pathParams.forEach(param => {
    const example = param.example || param.schema?.example || `{${param.name}}`;
    url = url.replace(`{${param.name}}`, String(example));
  });
  
  return url;
}

function buildQueryString(params?: OpenAPIParameter[]): string {
  const queryParams = params?.filter(p => p.in === 'query') || [];
  if (queryParams.length === 0) return '';
  
  const pairs = queryParams.map(p => {
    const value = p.example || p.schema?.example || 'value';
    return `${p.name}=${encodeURIComponent(String(value))}`;
  });
  
  return '?' + pairs.join('&');
}

export function generateCurl(
  spec: OpenAPISpec,
  endpoint: ParsedEndpoint,
  options: GeneratorOptions
): string {
  const allParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])];
  const url = buildUrl(options.baseUrl, endpoint.path, allParams) + buildQueryString(allParams);
  const method = endpoint.method.toUpperCase();
  const body = getRequestBody(spec, endpoint);
  
  let cmd = `curl -X ${method} "${url}"`;
  
  // Add headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (options.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }
  
  Object.entries(headers).forEach(([key, value]) => {
    cmd += ` \\\n  -H "${key}: ${value}"`;
  });
  
  // Add body
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    cmd += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  }
  
  return cmd;
}

export function generateJavaScript(
  spec: OpenAPISpec,
  endpoint: ParsedEndpoint,
  options: GeneratorOptions
): string {
  const allParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])];
  const url = buildUrl(options.baseUrl, endpoint.path, allParams) + buildQueryString(allParams);
  const method = endpoint.method.toUpperCase();
  const body = getRequestBody(spec, endpoint);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (options.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }
  
  let code = `const response = await fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4).split('\n').join('\n  ')},`;
  
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    code += `\n  body: JSON.stringify(${JSON.stringify(body, null, 4).split('\n').join('\n  ')}),`;
  }
  
  code += `
});

const data = await response.json();
console.log(data);`;
  
  return code;
}

export function generatePython(
  spec: OpenAPISpec,
  endpoint: ParsedEndpoint,
  options: GeneratorOptions
): string {
  const allParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])];
  const url = buildUrl(options.baseUrl, endpoint.path, allParams) + buildQueryString(allParams);
  const method = endpoint.method.toLowerCase();
  const body = getRequestBody(spec, endpoint);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (options.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }
  
  let code = `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}
`;

  if (body && ['post', 'put', 'patch'].includes(method)) {
    code += `payload = ${JSON.stringify(body, null, 4)}

response = requests.${method}(url, headers=headers, json=payload)`;
  } else {
    code += `
response = requests.${method}(url, headers=headers)`;
  }
  
  code += `

print(response.json())`;
  
  return code;
}

export function generateGo(
  spec: OpenAPISpec,
  endpoint: ParsedEndpoint,
  options: GeneratorOptions
): string {
  const allParams = [...(endpoint.pathParameters || []), ...(endpoint.operation.parameters || [])];
  const url = buildUrl(options.baseUrl, endpoint.path, allParams) + buildQueryString(allParams);
  const method = endpoint.method.toUpperCase();
  const body = getRequestBody(spec, endpoint);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (options.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }
  
  let bodyCode = '';
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    bodyCode = `
    payload := []byte(\`${JSON.stringify(body, null, 2)}\`)
    req, err := http.NewRequest("${method}", url, bytes.NewBuffer(payload))`;
  } else {
    bodyCode = `
    req, err := http.NewRequest("${method}", url, nil)`;
  }
  
  let headersCode = Object.entries(headers)
    .map(([key, value]) => `    req.Header.Set("${key}", "${value}")`)
    .join('\n');
  
  return `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    url := "${url}"
${bodyCode}
    if err != nil {
        panic(err)
    }

${headersCode}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
}

export function generateCode(
  language: CodeLanguage,
  spec: OpenAPISpec,
  endpoint: ParsedEndpoint,
  options: GeneratorOptions
): string {
  switch (language) {
    case 'curl':
      return generateCurl(spec, endpoint, options);
    case 'javascript':
      return generateJavaScript(spec, endpoint, options);
    case 'python':
      return generatePython(spec, endpoint, options);
    case 'go':
      return generateGo(spec, endpoint, options);
    default:
      return '';
  }
}

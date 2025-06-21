import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';
import type { OpenAPIV3 } from 'openapi-types';

/**
 * Parses an OpenAPI specification from a URL or file path.
 * Supports both JSON and YAML formats.
 * Throws detailed errors for network issues, file access problems, and parsing errors.
 */
export class OpenAPIParser {
  private async parseUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept:
            'application/json, application/yaml, text/yaml, text/plain, text/x-yaml',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error: ${String(error)}`);
    }
  }

  private async parseFile(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        if (error.code === 'ENOENT') {
          throw new Error(`File not found: ${filePath}`);
        }
        if (error.code === 'EACCES') {
          throw new Error(`Permission denied: ${filePath}`);
        }
      }
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  private parseContent(content: string, source: string): OpenAPIV3.Document {
    try {
      if (content.trim().startsWith('{')) {
        return JSON.parse(content) as OpenAPIV3.Document;
      }

      const parsedContent = load(content) as OpenAPIV3.Document;

      return parsedContent;
    } catch (error) {
      throw new Error(
        `Failed to parse OpenAPI spec from ${source}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  async parse(source: string): Promise<OpenAPIV3.Document> {
    let content: string;

    if (source.startsWith('https://') || source.startsWith('http://')) {
      content = await this.parseUrl(source);
    } else {
      content = await this.parseFile(source);
    }

    const document = this.parseContent(content, source);

    return document;
  }
}

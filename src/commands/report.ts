import consola from 'consola';
import { OpenAPIScorer } from '../lib/reporter';

interface ReportOptions {
  format?: 'console' | 'markdown' | 'html';
  output?: string;
}

/**
 * Generates a detailed scoring report for an OpenAPI specification
 * @param source - File path or URL to the OpenAPI specification
 * @param options - Report generation options
 * @returns Promise<void>
 */
export async function report(
  source: string,
  options: ReportOptions = {},
): Promise<void> {
  const startTime = Date.now();
  const scorer = new OpenAPIScorer();
  const format = options.format || 'console';

  if ((format === 'markdown' || format === 'html') && !options.output) {
    consola.error('Output file path is required for markdown and html formats');
    consola.info('Use: --output <file> or -o <file>');
    process.exit(1);
  }

  consola.start(
    `Generating ${format} report for OpenAPI specification: ${source}`,
  );
  consola.log('='.repeat(60));

  try {
    const result = await scorer.scoreSpec(source);

    switch (format) {
      case 'markdown':
        await scorer.generateMarkdownReport(
          result,
          options.output ?? '',
          Date.now() - startTime,
        );
        break;
      case 'html':
        await scorer.generateHtmlReport(
          result,
          options.output ?? '',
          Date.now() - startTime,
        );
        break;
      default:
        scorer.printScoringResult(result, Date.now() - startTime);
    }
  } catch (error) {
    consola.error('Unexpected error during report generation:');
    consola.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

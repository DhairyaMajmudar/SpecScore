import consola from 'consola';
import { OpenAPIScorer } from '../lib/reporter';

/**
 * Generates a detailed scoring report for an OpenAPI specification
 * @param source - File path or URL to the OpenAPI specification
 * @returns Promise<void>
 */
export async function report(source: string): Promise<void> {
  const startTime = Date.now();
  const scorer = new OpenAPIScorer();

  consola.start(`Generating report for OpenAPI specification: ${source}`);
  consola.log('='.repeat(60));

  try {
    const result = await scorer.scoreSpec(source);
    scorer.printScoringResult(result, Date.now() - startTime);
  } catch (error) {
    consola.error('Unexpected error during report generation:');
    consola.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

import consola from 'consola';
import { OpenAPIValidator } from '../lib/validator';

/**
 * Validates an OpenAPI specification using swagger-parser
 * @param source - File path or URL to the OpenAPI specification
 * @returns Promise<void>
 */
export async function validate(source: string): Promise<void> {
  const startTime = Date.now();
  const validator = new OpenAPIValidator();

  consola.start(`Validating OpenAPI specification: ${source}`);
  consola.log('');

  try {
    const result = await validator.validateSpec(source);

    if (result.isValid) {
      validator.printSuccessResult(result, Date.now() - startTime);
    } else {
      validator.printErrorResult(result, Date.now() - startTime);
      process.exit(1);
    }
  } catch (error) {
    consola.error('Unexpected error during validation:');
    consola.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

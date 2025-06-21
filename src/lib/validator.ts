import SwaggerParser from '@apidevtools/swagger-parser';
import chalk from 'chalk';
import consola from 'consola';
import type { OpenAPIV3 } from 'openapi-types';
import { OpenAPIParser } from './parser';

/**
 * Validation result interface containing the parsed document and any validation errors
 */
export interface ValidationResult {
  isValid: boolean;
  document?: OpenAPIV3.Document;
  errors: string[];
  warnings: string[];
  stats?: {
    paths: number;
    operations: number;
    schemas: number;
    parameters: number;
  };
}

/**
 * OpenAPI validator that uses swagger-parser for comprehensive validation
 * Validates structure, references, and schema compliance
 */
export class OpenAPIValidator {
  private parser: OpenAPIParser;

  constructor() {
    this.parser = new OpenAPIParser();
  }

  /**
   * Helper function to add realistic delays between validation steps
   */
  private delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Validates an OpenAPI specification using swagger-parser
   * @param source - File path or URL to the OpenAPI specification
   * @returns Promise<ValidationResult>
   */
  async validateSpec(source: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Parse document
      consola.start('Parsing OpenAPI document...');
      await this.delay(800); // Simulate parsing time
      const document = await this.parser.parse(source);
      consola.success(chalk.green.bold('Document parsed successfully'));
      console.log('');

      // Step 2: Validate with swagger-parser
      consola.start('Validating against OpenAPI specification...');
      await this.delay(1200); // Simulate validation time
      const validatedApi = await SwaggerParser.validate(document);
      consola.success(chalk.green.bold('Validation successful!'));
      console.log('');

      // Step 3: Additional validation checks
      consola.start('Analyzing document structure...');
      await this.delay(600); // Simulate analysis time
      const additionalChecks = this.performAdditionalValidation(
        validatedApi as OpenAPIV3.Document,
      );
      consola.success(
        chalk.green.bold('Document structure analysis completed'),
      );

      result.isValid = true;
      result.document = validatedApi as OpenAPIV3.Document;
      result.warnings = additionalChecks.warnings;
      result.stats = this.calculateStats(validatedApi as OpenAPIV3.Document);
    } catch (error) {
      result.isValid = false;

      if (error instanceof Error) {
        if (error.name === 'ParserError') {
          result.errors.push(`Parser Error: ${error.message}`);
        } else if (error.name === 'ResolverError') {
          result.errors.push(`Reference Resolution Error: ${error.message}`);
        } else if (error.name === 'ValidatorError') {
          result.errors.push(`Schema Validation Error: ${error.message}`);
        } else if (error.name === 'SyntaxError') {
          result.errors.push(`Syntax Error: ${error.message}`);
        } else {
          result.errors.push(`Validation Error: ${error.message}`);
        }
      } else {
        result.errors.push(`Unknown validation error: ${String(error)}`);
      }
    }

    return result;
  }

  /**
   * Perform additional validation checks beyond swagger-parser validation
   */
  private performAdditionalValidation(document: OpenAPIV3.Document): {
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (!document.paths || Object.keys(document.paths).length === 0) {
      warnings.push('No paths defined in the specification');
    }

    if (!document.info.description) {
      warnings.push('API description is missing from info object');
    }

    let missingExamples = 0;
    if (document.paths) {
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          Object.values(pathItem).forEach((operation) => {
            if (
              operation &&
              typeof operation === 'object' &&
              'responses' in operation
            ) {
              Object.values(operation.responses || {}).forEach((response) => {
                if (
                  response &&
                  typeof response === 'object' &&
                  'content' in response
                ) {
                  Object.values(response.content || {}).forEach((mediaType) => {
                    if (!mediaType.example && !mediaType.examples) {
                      missingExamples++;
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    if (missingExamples > 0) {
      warnings.push(`${missingExamples} response(s) missing examples`);
    }

    if (!document.components?.securitySchemes && !document.security) {
      warnings.push('No security schemes defined');
    }

    if (document.openapi.startsWith('3.0')) {
      warnings.push(
        'Consider upgrading to OpenAPI 3.1.0 for improved JSON Schema support',
      );
    }

    return { warnings };
  }

  /**
   * Calculate statistics about the OpenAPI document
   */
  private calculateStats(
    document: OpenAPIV3.Document,
  ): ValidationResult['stats'] {
    let paths = 0;
    let operations = 0;
    let schemas = 0;
    let parameters = 0;

    // Count paths and operations
    if (document.paths) {
      paths = Object.keys(document.paths).length;
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          const methods = [
            'get',
            'post',
            'put',
            'delete',
            'patch',
            'head',
            'options',
            'trace',
          ];
          methods.forEach((method) => {
            if (pathItem[method as keyof typeof pathItem]) {
              operations++;
            }
          });
        }
      });
    }

    if (document.components?.schemas) {
      schemas = Object.keys(document.components.schemas).length;
    }

    if (document.components?.parameters) {
      parameters = Object.keys(document.components.parameters).length;
    }

    return { paths, operations, schemas, parameters };
  }

  /**
   * Print successful validation results
   */
  printSuccessResult(result: ValidationResult, duration: number): void {
    consola.log('');

    if (result.document) {
      consola.info(chalk.blue.bold('Document Information:'));
      consola.log(
        `   ${chalk.cyan('OpenAPI Version:')} ${chalk.white(
          result.document.openapi,
        )}`,
      );
      consola.log(
        `   ${chalk.cyan('Title:')} ${chalk.white(result.document.info.title)}`,
      );
      consola.log(
        `   ${chalk.cyan('Version:')} ${chalk.white(
          result.document.info.version,
        )}`,
      );
      if (result.document.info.description) {
        consola.log(
          `   ${chalk.cyan('Description:')} ${chalk.gray(
            result.document.info.description.substring(0, 100),
          )}${result.document.info.description.length > 100 ? '...' : ''}`,
        );
      }
      consola.log('');
    }

    if (result.stats) {
      consola.info(chalk.blue.bold('Document Statistics:'));
      consola.log(
        `   ${chalk.cyan('Paths:')} ${chalk.yellow(result.stats.paths)}`,
      );
      consola.log(
        `   ${chalk.cyan('Operations:')} ${chalk.yellow(
          result.stats.operations,
        )}`,
      );
      consola.log(
        `   ${chalk.cyan('Schemas:')} ${chalk.yellow(result.stats.schemas)}`,
      );
      consola.log(
        `   ${chalk.cyan('Parameters:')} ${chalk.yellow(
          result.stats.parameters,
        )}`,
      );
      consola.log('');
    }

    if (result.warnings.length > 0) {
      consola.warn(chalk.yellow.bold('Warnings:'));
      result.warnings.forEach((warning) =>
        consola.log(`   ${chalk.yellow('•')} ${chalk.yellow(warning)}`),
      );
      consola.log('');
    }

    consola.success(`Validation completed in ${duration}ms`);
  }

  /**
   * Print error validation results
   */
  printErrorResult(result: ValidationResult, duration: number): void {
    consola.error(chalk.red.bold('Validation failed!'));
    consola.log('');

    consola.error(chalk.red.bold('Errors:'));
    result.errors.forEach((error, index) => {
      consola.log(`   ${chalk.red(`${index + 1}.`)} ${chalk.red(error)}`);
    });
    consola.log('');

    if (result.warnings.length > 0) {
      consola.warn(chalk.yellow.bold('Additional Warnings:'));
      result.warnings.forEach((warning) =>
        consola.log(`   ${chalk.yellow('•')} ${chalk.yellow(warning)}`),
      );
      consola.log('');
    }

    consola.error(`Validation failed after ${duration}ms`);
  }
}

import chalk from 'chalk';
import consola from 'consola';
import type { OpenAPIV3 } from 'openapi-types';
import { type CriteriaScore, Evaluators } from './evaluators';
import { OpenAPIParser } from './parser';

/**
 * Complete scoring result for the OpenAPI specification
 */
export interface ScoringResult {
  totalScore: number;
  grade: string;
  criteria: CriteriaScore[];
  feedback: string[];
  document: OpenAPIV3.Document;
}

/**
 * OpenAPI specification scorer that evaluates quality and best practices
 * Provides detailed scoring based on industry standards and conventions
 */
export class OpenAPIScorer {
  private parser: OpenAPIParser;
  private evaluators: Evaluators;

  constructor() {
    this.parser = new OpenAPIParser();
    this.evaluators = new Evaluators();
  }

  private delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Scores an OpenAPI specification based on multiple criteria
   * @param source - File path or URL to the OpenAPI specification
   * @returns Promise<ScoringResult> - Detailed scoring results
   */
  async scoreSpec(source: string): Promise<ScoringResult> {
    // Step 1: Parse document
    consola.start('Parsing OpenAPI document...');
    await this.delay(800);
    const document = await this.parser.parse(source);
    consola.success(chalk.green.bold('Document parsed successfully'));

    // Step 2: Analyze schema and types
    consola.start('Analyzing schema & types...');
    await this.delay(600);
    const schemaScore = this.evaluators.scoreSchemaAndTypes(document);
    consola.success(chalk.green.bold('Schema analysis completed'));

    // Step 3: Check descriptions and documentation
    consola.start('Evaluating descriptions & documentation...');
    await this.delay(700);
    const descriptionScore = this.evaluators.scoreDescriptions(document);
    consola.success(chalk.green.bold('Documentation analysis completed'));

    // Step 4: Analyze paths and operations
    consola.start('Analyzing paths & operations...');
    await this.delay(500);
    const pathsScore = this.evaluators.scorePathsAndOperations(document);
    consola.success(chalk.green.bold('Paths analysis completed'));

    // Step 5: Check response codes
    consola.start('Evaluating response codes...');
    await this.delay(400);
    const responseCodesScore = this.evaluators.scoreResponseCodes(document);
    consola.success(chalk.green.bold('Response codes analysis completed'));

    // Step 6: Check examples and samples
    consola.start('Checking examples & samples...');
    await this.delay(300);
    const examplesScore = this.evaluators.scoreExamples(document);
    consola.success(chalk.green.bold('Examples analysis completed'));

    // Step 7: Analyze security
    consola.start('Evaluating security...');
    await this.delay(400);
    const securityScore = this.evaluators.scoreSecurity(document);
    consola.success(chalk.green.bold('Security analysis completed'));

    // Step 8: Check best practices
    consola.start('Checking best practices...');
    await this.delay(500);
    const bestPracticesScore = this.evaluators.scoreBestPractices(document);
    consola.success(chalk.green.bold('Best practices analysis completed'));

    const criteria = [
      schemaScore,
      descriptionScore,
      pathsScore,
      responseCodesScore,
      examplesScore,
      securityScore,
      bestPracticesScore,
    ];

    const totalScore = criteria.reduce(
      (sum, criteria) => sum + criteria.score,
      0,
    );
    const grade = this.calculateGrade(totalScore);

    return {
      totalScore,
      grade,
      criteria,
      feedback: this.generateOverallFeedback(totalScore, criteria),
      document,
    };
  }

  /**
   * Calculate letter grade based on total score
   */
  private calculateGrade(score: number): string {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Generate overall feedback based on scoring results
   */
  private generateOverallFeedback(
    totalScore: number,
    criteria: CriteriaScore[],
  ): string[] {
    const feedback: string[] = [];

    if (totalScore >= 90) {
      feedback.push(
        'Excellent! Your OpenAPI specification follows industry best practices.',
      );
    } else if (totalScore >= 80) {
      feedback.push(
        'Good job! Your API specification is well-structured with minor areas for improvement.',
      );
    } else if (totalScore >= 70) {
      feedback.push(
        'Your API specification is decent but has several areas that could be improved.',
      );
    } else if (totalScore >= 60) {
      feedback.push(
        'Your API specification needs significant improvements to meet best practices.',
      );
    } else {
      feedback.push(
        'Your API specification requires major improvements across multiple areas.',
      );
    }

    const weakAreas = criteria
      .filter((c) => c.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);

    if (weakAreas.length > 0) {
      feedback.push(
        `Focus on improving: ${weakAreas.map((area) => area.name).join(', ')}`,
      );
    }

    return feedback;
  }

  /**
   * Print detailed scoring results
   */
  printScoringResult(result: ScoringResult, duration: number): void {
    consola.log('');

    const gradeColor =
      result.grade === 'A'
        ? 'green'
        : result.grade === 'B'
          ? 'blue'
          : result.grade === 'C'
            ? 'yellow'
            : 'red';

    consola.info(chalk.bold(`OpenAPI Specification Report`));
    consola.log(
      `   ${chalk.cyan('API Title:')} ${chalk.white(
        result.document.info.title,
      )}`,
    );
    consola.log(
      `   ${chalk.cyan('Version:')} ${chalk.white(
        result.document.info.version,
      )}`,
    );
    consola.log(
      `   ${chalk.cyan('Overall Score:')} ${chalk[gradeColor].bold(
        `${result.totalScore}/100 (${result.grade})`,
      )}`,
    );
    consola.log('');

    consola.info(chalk.blue.bold('📋 Detailed Scoring:'));
    result.criteria.forEach((criteria) => {
      const percentageColor =
        criteria.percentage >= 80
          ? 'green'
          : criteria.percentage >= 60
            ? 'yellow'
            : 'red';

      consola.log(
        `   ${chalk.cyan(criteria.name.padEnd(25))} ${chalk[percentageColor](
          `${criteria.score}/${criteria.maxScore}`,
        )} ${chalk.gray(`(${criteria.percentage}%)`)}`,
      );

      if (criteria.feedback.length > 0) {
        criteria.feedback.forEach((item) => {
          consola.log(`     ${chalk.gray('•')} ${chalk.gray(item)}`);
        });
      }
    });
    consola.log('');

    if (result.feedback.length > 0) {
      consola.info(chalk.blue.bold('Overall Feedback:'));
      result.feedback.forEach((item) => {
        consola.log(`   ${chalk.yellow('•')} ${item}`);
      });
      consola.log('');
    }

    const allSuggestions = result.criteria.flatMap((c) => c.suggestions);
    if (allSuggestions.length > 0) {
      consola.info(chalk.blue.bold('Suggestions for Improvement:'));
      allSuggestions.slice(0, 5).forEach((suggestion) => {
        consola.log(`   ${chalk.yellow('•')} ${suggestion}`);
      });
      consola.log('');
    }

    consola.success(`Report generated in ${duration}ms`);
  }
}

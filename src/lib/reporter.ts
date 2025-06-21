import { writeFile } from 'node:fs/promises';
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
    consola.success('Document parsed successfully');

    // Step 2: Analyze schema and types
    consola.start('🔍 Analyzing schema & types...');
    await this.delay(600);
    const schemaScore = this.evaluators.scoreSchemaAndTypes(document);
    consola.success(chalk.green.bold('Schema analysis completed'));

    // Step 3: Check descriptions and documentation
    consola.start('📝 Evaluating descriptions & documentation...');
    await this.delay(700);
    const descriptionScore = this.evaluators.scoreDescriptions(document);
    consola.success('Documentation analysis completed');

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

    if (totalScore >= 80) {
      feedback.push(
        'Excellent! Your OpenAPI specification follows industry best practices.',
      );
    } else if (totalScore >= 70) {
      feedback.push(
        'Good job! Your API specification is well-structured with minor areas for improvement.',
      );
    } else if (totalScore >= 60) {
      feedback.push(
        'Your API specification is decent but has several areas that could be improved.',
      );
    } else if (totalScore >= 50) {
      feedback.push(
        'Your API specification needs significant improvements to meet best practices.',
      );
    } else {
      feedback.push(
        'Your API specification requires major improvements across multiple areas.',
      );
    }

    const weakAreas = criteria
      .filter((c) => c.percentage < 50)
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
   * Generate Markdown report and save to file
   */
  async generateMarkdownReport(
    result: ScoringResult,
    outputPath: string,
    duration: number,
  ): Promise<void> {
    const markdown = this.generateMarkdownContent(result, duration);

    try {
      await writeFile(outputPath, markdown, 'utf-8');
      consola.success(`📄 Markdown report generated: ${outputPath}`);
    } catch (error) {
      consola.error(`Failed to write markdown report: ${error}`);
      throw error;
    }
  }

  /**
   * Generate HTML report and save to file
   */
  async generateHtmlReport(
    result: ScoringResult,
    outputPath: string,
    duration: number,
  ): Promise<void> {
    const html = this.generateHtmlContent(result, duration);

    try {
      await writeFile(outputPath, html, 'utf-8');
      consola.success(`🌐 HTML report generated: ${outputPath}`);
    } catch (error) {
      consola.error(`Failed to write HTML report: ${error}`);
      throw error;
    }
  }

  /**
   * Generate markdown content for the report
   */
  private generateMarkdownContent(
    result: ScoringResult,
    duration: number,
  ): string {
    const date = new Date().toISOString().split('T')[0];

    let markdown = `# OpenAPI Specification Report

Generated on: ${date}  
Report Duration: ${duration}ms

## API Information

| Field | Value |
|-------|-------|
| **Title** | ${result.document.info.title} |
| **Version** | ${result.document.info.version} |
| **OpenAPI Version** | ${result.document.openapi} |
| **Overall Score** | **${result.totalScore}/100 (Grade: ${result.grade})** |

## Scoring Breakdown

| Criteria | Score | Max | Percentage | Status |
|----------|-------|-----|------------|---------|
`;

    result.criteria.forEach((criteria) => {
      const status =
        criteria.percentage >= 80
          ? '✅'
          : criteria.percentage >= 60
            ? '⚠️'
            : '❌';
      markdown += `| ${criteria.name} | ${criteria.score} | ${criteria.maxScore} | ${criteria.percentage}% | ${status} |\n`;
    });

    markdown += `\n## Detailed Analysis\n\n`;

    result.criteria.forEach((criteria) => {
      markdown += `### ${criteria.name} (${criteria.score}/${criteria.maxScore})\n\n`;

      if (criteria.feedback.length > 0) {
        markdown += `**Findings:**\n`;
        criteria.feedback.forEach((item) => {
          markdown += `- ${item}\n`;
        });
        markdown += `\n`;
      }

      if (criteria.suggestions.length > 0) {
        markdown += `**Suggestions:**\n`;
        criteria.suggestions.forEach((suggestion) => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    });

    if (result.feedback.length > 0) {
      markdown += `## Overall Feedback\n\n`;
      result.feedback.forEach((item) => {
        markdown += `- ${item}\n`;
      });
      markdown += `\n`;
    }

    const allSuggestions = result.criteria.flatMap((c) => c.suggestions);
    if (allSuggestions.length > 0) {
      markdown += `## Priority Improvements\n\n`;
      allSuggestions.slice(0, 5).forEach((suggestion, index) => {
        markdown += `${index + 1}. ${suggestion}\n`;
      });
    }

    markdown += `\n---\n*Report generated by score-api CLI tool*`;

    return markdown;
  }

  /**
   * Generate HTML content for the report
   */
  private generateHtmlContent(result: ScoringResult, duration: number): string {
    const date = new Date().toISOString().split('T')[0];
    const gradeColor =
      result.grade === 'A'
        ? '#22c55e'
        : result.grade === 'B'
          ? '#3b82f6'
          : result.grade === 'C'
            ? '#eab308'
            : '#ef4444';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenAPI Report - ${result.document.info.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .title { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .subtitle { opacity: 0.9; font-size: 1.1rem; }
        .score-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .score-display { text-align: center; padding: 1rem; }
        .score-number { font-size: 3rem; font-weight: bold; color: ${gradeColor}; }
        .grade { font-size: 1.5rem; font-weight: bold; color: ${gradeColor}; margin-left: 0.5rem; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .info-item { background: #f1f5f9; padding: 1rem; border-radius: 8px; }
        .info-label { font-weight: bold; color: #64748b; margin-bottom: 0.25rem; }
        .criteria-grid { display: grid; gap: 1rem; margin-bottom: 2rem; }
        .criteria-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .criteria-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .criteria-name { font-size: 1.25rem; font-weight: bold; }
        .criteria-score { font-size: 1.1rem; font-weight: bold; }
        .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .feedback-list { list-style: none; }
        .feedback-item { padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; }
        .feedback-item:last-child { border-bottom: none; }
        .suggestions { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 0 8px 8px 0; margin-top: 1rem; }
        .section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .section-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1e293b; }
        .footer { text-align: center; padding: 2rem; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">📊 OpenAPI Specification Report</div>
            <div class="subtitle">Generated on ${date} • Duration: ${duration}ms</div>
        </div>

        <div class="score-card">
            <div class="score-display">
                <div class="score-number">${
                  result.totalScore
                }<span style="font-size: 1.5rem; color: #64748b;">/100</span><span class="grade">${
                  result.grade
                }</span></div>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">API Title</div>
                    <div>${result.document.info.title}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Version</div>
                    <div>${result.document.info.version}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">OpenAPI Version</div>
                    <div>${result.document.openapi}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Grade</div>
                    <div style="color: ${gradeColor}; font-weight: bold;">${
                      result.grade
                    }</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🎯 Scoring Breakdown</div>
            <div class="criteria-grid">
                ${result.criteria
                  .map((criteria) => {
                    const color =
                      criteria.percentage >= 80
                        ? '#22c55e'
                        : criteria.percentage >= 60
                          ? '#eab308'
                          : '#ef4444';
                    return `
                    <div class="criteria-card">
                        <div class="criteria-header">
                            <div class="criteria-name">${criteria.name}</div>
                            <div class="criteria-score" style="color: ${color};">${
                              criteria.score
                            }/${criteria.maxScore} (${criteria.percentage}%)</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${
                              criteria.percentage
                            }%; background-color: ${color};"></div>
                        </div>
                        ${
                          criteria.feedback.length > 0
                            ? `
                            <ul class="feedback-list">
                                ${criteria.feedback
                                  .map(
                                    (item) =>
                                      `<li class="feedback-item">• ${item}</li>`,
                                  )
                                  .join('')}
                            </ul>
                        `
                            : ''
                        }
                        ${
                          criteria.suggestions.length > 0
                            ? `
                            <div class="suggestions">
                                <strong>💡 Suggestions:</strong>
                                <ul style="margin-top: 0.5rem;">
                                    ${criteria.suggestions
                                      .map(
                                        (suggestion) =>
                                          `<li>• ${suggestion}</li>`,
                                      )
                                      .join('')}
                                </ul>
                            </div>
                        `
                            : ''
                        }
                    </div>
                  `;
                  })
                  .join('')}
            </div>
        </div>

        ${
          result.feedback.length > 0
            ? `
            <div class="section">
                <div class="section-title">💬 Overall Feedback</div>
                <ul class="feedback-list">
                    ${result.feedback
                      .map((item) => `<li class="feedback-item">• ${item}</li>`)
                      .join('')}
                </ul>
            </div>
        `
            : ''
        }

        <div class="footer">
            <p>Report generated by <strong>score-api</strong> CLI tool</p>
        </div>
    </div>
</body>
</html>`;
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

    consola.info(chalk.blue.bold('Detailed Scoring:'));
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

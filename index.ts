#!/usr/bin/env node

import { program } from 'commander';
import { report, validate } from './src';

program
  .name('score-api')
  .description('CLI to validate OpenAPI schemas and generate reports')
  .version('0.1.0');

program
  .command('validate')
  .description('Validate an OpenAPI schema file or url link')
  .argument('<file>', 'Path to the OpenAPI schema file (yaml or json) or URL')
  .action(validate);

program
  .command('report')
  .description('Generate a report for an OpenAPI schema file or url link')
  .argument('<file>', 'Path to the OpenAPI schema file (yaml or json) or URL')
  .option(
    '-f, --format <format>',
    'Output format: console, markdown, html',
    'console',
  )
  .option(
    '-o, --output <file>',
    'Output file path (for markdown, html formats)',
    'report.md',
  )
  .action(report);

program.parse(process.argv);

process.on('SIGINT', () => {
  process.exit();
});

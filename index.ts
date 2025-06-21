import { program } from 'commander';
import { validate } from './src';

program
  .command('score-api')
  .description('CLI to validate OpenAPI schemas and generate reports')
  .version('0.1.0');

program
  .command('validate')
  .description('Validate an OpenAPI schema file or url link')
  .argument('<file>', 'Path to the OpenAPI schema file (yaml or json) or URL')
  .action(validate);

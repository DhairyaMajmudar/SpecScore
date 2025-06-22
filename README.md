# SpecScore 🚀

[![npm version](https://badge.fury.io/js/spec-score.svg)](https://badge.fury.io/js/spec-score)
[![CI](https://github.com/DhairyaMajmudar/SpecScore/actions/workflows/ci.yaml/badge.svg)](https://github.com/DhairyaMajmudar/SpecScore/actions/workflows/ci.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, fast CLI tool for OpenAPI specification validation and quality scoring. SpecScore helps you ensure your API documentation follows best practices and industry standards.

## Features

- **Comprehensive Validation** - Validates OpenAPI 3.x specifications using swagger-parser
- **Quality Scoring** - Evaluates your API spec across 7 key criteria with detailed feedback
- **Multiple Output Formats** - Console, Markdown, and HTML reports
- **URL & File Support** - Works with local files and remote URLs
- **Fast & Lightweight** - Built with Bun for optimal performance
- **Actionable Insights** - Get specific suggestions for improvement

## Quick Start

### Installation

```bash
# Install globally via npm
npm install -g spec-score

# Or use with npx (no installation required)
npx spec-score validate ./openapi.yaml
```

### Basic Usage

```bash
# Validate an OpenAPI specification
spec-score validate ./openapi.yaml

# Validate from URL
spec-score validate https://api.example.com/openapi.json

# Generate a detailed scoring report
spec-score report ./openapi.yaml
```

## Commands

### `validate`

Validates an OpenAPI specification for structural correctness and compliance.

```bash
spec-score validate <file|url>
```

**Examples:**

```bash
spec-score validate spec.yaml
spec-score validate https://petstore3.swagger.io/api/v3/openapi.json
```

<img src="https://github.com/user-attachments/assets/2391cbf3-f6b8-49f4-99b8-992b030cb923" width="500" />

<br/>
<br/>


**Output includes:**

- Document parsing and validation status
- API information (title, version, description)
- Statistics (paths, operations, schemas, parameters)
- Warnings and suggestions

### `report`

Generates a comprehensive quality report with scoring across multiple criteria.

```bash
spec-score report <file|url> [options]
```

**Options:**

- `-f, --format <format>` - Output format: `console`, `markdown`, `html` (default: console)
- `-o, --output <file>` - Output file path (required for markdown/html formats)

**Examples:**

```bash
# Console report (default)
spec-score report ./openapi.yaml

# Markdown report
spec-score report ./openapi.yaml -f markdown -o api-report.md

# HTML report
spec-score report ./openapi.yaml -f html -o api-report.html
```
<img src="https://github.com/user-attachments/assets/5e5b7ba1-8d81-49d0-b147-460f4e1a793b" width="500" height="450"/>

## Scoring Criteria

SpecScore evaluates your OpenAPI specification across 7 key areas:

| Criteria                         | Max Points | Description                                                          |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| **Schema & Types**               | 20         | Proper data types, schema definitions, and type safety               |
| **Descriptions & Documentation** | 20         | Comprehensive descriptions for operations, parameters, and responses |
| **Paths & Operations**           | 15         | RESTful naming conventions and CRUD patterns                         |
| **Response Codes**               | 15         | Appropriate HTTP status codes for different scenarios                |
| **Examples & Samples**           | 10         | Request/response examples for better developer experience            |
| **Security**                     | 10         | Security schemes and authentication methods                          |
| **Best Practices**               | 10         | Versioning, servers, tags, and component reuse                       |

### Grade Scale

- **A (80-100)**: Excellent - Follows industry best practices
- **B (70-79)**: Good - Well-structured with minor improvements needed
- **C (60-69)**: Decent - Several areas for improvement
- **D (50-59)**: Needs work - Significant improvements required
- **F (0-49)**: Poor - Major improvements needed across multiple areas

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 20 (for compatibility)

### Setup

```bash
# Clone the repository
git clone https://github.com/DhairyaMajmudar/SpecScore.git
cd SpecScore

# Install dependencies
bun install

# Build the project
bun run build

# Start CLI locally
bun run index.ts [command] [flags]

# Run tests
bun test
```

## Support

- **Found a bug?** [Open an issue](https://github.com/DhairyaMajmudar/SpecScore/issues)
- **Like this project?** [Sponsor on GitHub](https://github.com/sponsors/DhairyaMajmudar)
- **Need help?** Email: majmudar777@gmail.com

---

**Made with ❤️ by [Dhairya Majmudar](https://github.com/DhairyaMajmudar)**

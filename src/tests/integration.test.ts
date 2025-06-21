import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { OpenAPIScorer } from "../lib/reporter";
import { OpenAPIValidator } from "../lib/validator";

const TEST_FIXTURES_DIR = join(__dirname, "fixtures");
const TEST_OUTPUT_DIR = join(__dirname, "output");

describe("Integration Tests", () => {
  beforeAll(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    const testFiles = [
      "test-report.md",
      "test-report.html",
      "integration-test.md",
      "integration-test.html",
    ];

    testFiles.forEach((file) => {
      const filePath = join(TEST_OUTPUT_DIR, file);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });
  });

  describe("OpenAPIValidator Integration", () => {
    it("should validate a valid OpenAPI specification", async () => {
      const validator = new OpenAPIValidator();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");

      const result = await validator.validateSpec(validSpecPath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.document).toBeDefined();
      expect(result.document?.info.title).toBe("Pet Store API");
      expect(result.stats).toBeDefined();
      expect(result.stats?.paths).toBeGreaterThan(0);
      expect(result.stats?.operations).toBeGreaterThan(0);
      expect(result.stats?.schemas).toBeGreaterThan(0);
    });

    it("should detect validation errors in invalid OpenAPI specification", async () => {
      const validator = new OpenAPIValidator();
      const invalidSpecPath = join(TEST_FIXTURES_DIR, "broken-openapi.json");

      const result = await validator.validateSpec(invalidSpecPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle non-existent file gracefully", async () => {
      const validator = new OpenAPIValidator();
      const nonExistentPath = join(TEST_FIXTURES_DIR, "does-not-exist.yaml");

      const result = await validator.validateSpec(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("File not found");
    });

    it("should provide warnings for minimal specification", async () => {
      const validator = new OpenAPIValidator();
      const minimalSpecPath = join(TEST_FIXTURES_DIR, "minimal-openapi.json");

      const result = await validator.validateSpec(minimalSpecPath);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("description"))).toBe(true);
    });
  });

  describe("OpenAPIScorer Integration", () => {
    it("should score a valid OpenAPI specification", async () => {
      const scorer = new OpenAPIScorer();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");

      const result = await scorer.scoreSpec(validSpecPath);

      expect(result.totalScore).toBeGreaterThan(50);
      expect(result.grade).toBeDefined();
      expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
      expect(result.criteria).toHaveLength(7);
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.document).toBeDefined();

      const criteriaNames = result.criteria.map((c) => c.name);
      expect(criteriaNames).toContain("Schema & Types");
      expect(criteriaNames).toContain("Descriptions & Documentation");
      expect(criteriaNames).toContain("Paths & Operations");
      expect(criteriaNames).toContain("Response Codes");
      expect(criteriaNames).toContain("Examples & Samples");
      expect(criteriaNames).toContain("Security");
      expect(criteriaNames).toContain("Best Practices");
    });

    it("should score minimal specification lower", async () => {
      const scorer = new OpenAPIScorer();
      const minimalSpecPath = join(TEST_FIXTURES_DIR, "minimal-openapi.json");

      const result = await scorer.scoreSpec(minimalSpecPath);

      expect(result.totalScore).toBeLessThan(50);
      expect(["D", "F"]).toContain(result.grade);
      expect(result.criteria.some((c) => c.suggestions.length > 0)).toBe(true);
    });

    it("should generate markdown report", async () => {
      const scorer = new OpenAPIScorer();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");
      const outputPath = join(TEST_OUTPUT_DIR, "test-report.md");

      const result = await scorer.scoreSpec(validSpecPath);
      await scorer.generateMarkdownReport(result, outputPath, 1000);

      expect(existsSync(outputPath)).toBe(true);

      const content = await readFile(outputPath, "utf-8");
      expect(content).toContain("# OpenAPI Specification Report");
      expect(content).toContain("Pet Store API");
      expect(content).toContain(
        "| Criteria | Score | Max | Percentage | Status |"
      );
      expect(content).toContain("## Detailed Analysis");
    });

    it("should generate HTML report", async () => {
      const scorer = new OpenAPIScorer();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");
      const outputPath = join(TEST_OUTPUT_DIR, "test-report.html");

      const result = await scorer.scoreSpec(validSpecPath);
      await scorer.generateHtmlReport(result, outputPath, 1000);

      expect(existsSync(outputPath)).toBe(true);

      const content = await readFile(outputPath, "utf-8");
      expect(content).toContain("<!DOCTYPE html>");
      expect(content).toContain("OpenAPI Specification Report");
      expect(content).toContain("Pet Store API");
      expect(content).toContain("progress-bar");
      expect(content).toContain("criteria-card");
    });
  });

  describe("URL-based specification handling", () => {
    it("should handle mock HTTP response", async () => {
      const mockSpec = {
        openapi: "3.0.3",
        info: { title: "Remote API", version: "1.0.0" },
        paths: {
          "/test": {
            get: {
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      };

      const originalFetch = globalThis.fetch;
      //@ts-ignore
      globalThis.fetch = async () => {
        return new Response(JSON.stringify(mockSpec), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      try {
        const validator = new OpenAPIValidator();
        const result = await validator.validateSpec(
          "https://api.example.com/openapi.json"
        );

        expect(result.isValid).toBe(true);
        expect(result.document?.info.title).toBe("Remote API");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should handle network errors", async () => {
      const originalFetch = globalThis.fetch;
      //@ts-ignore
      globalThis.fetch = async () => {
        throw new Error("Network error");
      };

      try {
        const validator = new OpenAPIValidator();
        const result = await validator.validateSpec(
          "https://nonexistent.example.com/api.json"
        );

        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain("Network error");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("Component Analysis", () => {
    it("should analyze schema complexity correctly", async () => {
      const scorer = new OpenAPIScorer();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");

      const result = await scorer.scoreSpec(validSpecPath);

      const schemaScore = result.criteria.find(
        (c) => c.name === "Schema & Types"
      );
      expect(schemaScore).toBeDefined();
      expect(schemaScore?.score).toBeGreaterThan(10);
      expect(
        schemaScore?.feedback.some((f) => f.includes("schema definitions"))
      ).toBe(true);
    });

    it("should detect missing documentation", async () => {
      const scorer = new OpenAPIScorer();
      const minimalSpecPath = join(TEST_FIXTURES_DIR, "minimal-openapi.json");

      const result = await scorer.scoreSpec(minimalSpecPath);

      const docScore = result.criteria.find(
        (c) => c.name === "Descriptions & Documentation"
      );
      expect(docScore).toBeDefined();
      expect(docScore?.score).toBeLessThan(15);
      expect(docScore?.suggestions.length).toBeGreaterThan(0);
    });

    it("should evaluate security implementations", async () => {
      const scorer = new OpenAPIScorer();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");

      const result = await scorer.scoreSpec(validSpecPath);

      const securityScore = result.criteria.find((c) => c.name === "Security");
      expect(securityScore).toBeDefined();
      expect(securityScore?.score).toBeGreaterThanOrEqual(5);
      expect(
        securityScore?.feedback.some((f) => f.includes("security scheme"))
      ).toBe(true);
    });
  });

  describe("Performance and Error Handling", () => {
    it("should complete validation within reasonable time", async () => {
      const validator = new OpenAPIValidator();
      const validSpecPath = join(TEST_FIXTURES_DIR, "good-openapi.yaml");

      const startTime = Date.now();
      await validator.validateSpec(validSpecPath);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it("should handle malformed JSON gracefully", async () => {
      const malformedPath = join(TEST_OUTPUT_DIR, "malformed.json");
      await writeFile(
        malformedPath,
        '{ "openapi": "3.0.3", "info": { "title": "Test" }'
      );

      const validator = new OpenAPIValidator();
      const result = await validator.validateSpec(malformedPath);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Failed to parse");

      unlinkSync(malformedPath);
    });

    it("should handle malformed YAML gracefully", async () => {
      const malformedPath = join(TEST_OUTPUT_DIR, "malformed.yaml");
      await writeFile(
        malformedPath,
        'openapi: 3.0.3\ninfo:\n  title: "Test\n    version: 1.0.0'
      );

      const validator = new OpenAPIValidator();
      const result = await validator.validateSpec(malformedPath);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Failed to parse");

      unlinkSync(malformedPath);
    });
  });
});

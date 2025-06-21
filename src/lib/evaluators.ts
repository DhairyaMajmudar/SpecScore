import type { OpenAPIV3 } from 'openapi-types';

/**
 * Individual scoring result for a specific criteria
 */
export interface CriteriaScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string[];
  suggestions: string[];
}

export class Evaluators {
  /**
   * Score Schema & Types (20 points)
   * Evaluates proper data types and schema definitions
   */
  scoreSchemaAndTypes(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 20;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    const schemas = document.components?.schemas || {};
    const schemaCount = Object.keys(schemas).length;

    if (schemaCount > 0) {
      score += 5;
      feedback.push(`Found ${schemaCount} schema definitions`);
    } else {
      feedback.push('No schema definitions found');
      suggestions.push('Define reusable schemas in components.schemas');
    }

    let properlyTypedSchemas = 0;
    let freeFormObjects = 0;

    Object.entries(schemas).forEach(([_, schema]) => {
      if (schema && typeof schema === 'object' && 'type' in schema) {
        if (schema.type === 'object' && schema.properties) {
          properlyTypedSchemas++;
        } else if (
          schema.type === 'object' &&
          !schema.properties &&
          !schema.additionalProperties
        ) {
          freeFormObjects++;
        }
      }
    });

    if (properlyTypedSchemas > 0) {
      score += Math.min(
        10,
        (properlyTypedSchemas / Math.max(schemaCount, 1)) * 10,
      );
      feedback.push(
        `${properlyTypedSchemas} schemas have proper type definitions`,
      );
    }

    if (freeFormObjects > 0) {
      feedback.push(
        `${freeFormObjects} schemas are free-form objects without properties`,
      );
      suggestions.push(
        'Define specific properties for object schemas instead of using free-form objects',
      );
    }

    let operationsWithSchemas = 0;
    let totalOperations = 0;

    if (document.paths) {
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
          methods.forEach((method) => {
            const operation = pathItem[method];
            if (operation) {
              totalOperations++;

              if (
                operation.requestBody &&
                typeof operation.requestBody === 'object' &&
                'content' in operation.requestBody
              ) {
                Object.values(operation.requestBody.content).forEach(
                  (mediaType) => {
                    if (mediaType.schema) operationsWithSchemas++;
                  },
                );
              }

              Object.values(operation.responses).forEach((response) => {
                if (
                  response &&
                  typeof response === 'object' &&
                  'content' in response
                ) {
                  Object.values(response.content || {}).forEach((mediaType) => {
                    if (mediaType.schema) operationsWithSchemas++;
                  });
                }
              });
            }
          });
        }
      });
    }

    if (totalOperations > 0) {
      const schemaUsageRatio = operationsWithSchemas / (totalOperations * 2);
      score += Math.min(5, schemaUsageRatio * 5);
      feedback.push(
        `${Math.round(
          schemaUsageRatio * 100,
        )}% of operations use proper schemas`,
      );
    }

    if (score < maxScore * 0.5) {
      suggestions.push(
        'Increase use of strongly-typed schemas throughout the API',
      );
    }

    return {
      name: 'Schema & Types',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Descriptions & Documentation (20 points)
   * Evaluates completeness of documentation
   */
  scoreDescriptions(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 20;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (document.info.description && document.info.description.length > 10) {
      score += 3;
      feedback.push('API has a meaningful description');
    } else {
      suggestions.push(
        'Add a comprehensive description to the API info object',
      );
    }

    let pathsWithDescriptions = 0;
    let operationsWithDescriptions = 0;
    let parametersWithDescriptions = 0;
    let responsesWithDescriptions = 0;
    let totalPaths = 0;
    let totalOperations = 0;
    let totalParameters = 0;
    let totalResponses = 0;

    if (document.paths) {
      totalPaths = Object.keys(document.paths).length;

      Object.entries(document.paths).forEach(([_, pathItem]) => {
        if (pathItem) {
          if (pathItem.description) {
            pathsWithDescriptions++;
          }

          const methods = [
            'get',
            'post',
            'put',
            'patch',
            'delete',
            'options',
            'head',
            'trace',
          ] as const;

          methods.forEach((method) => {
            const operation = pathItem[method];
            if (operation) {
              totalOperations++;

              if (operation.description && operation.description.length > 5) {
                operationsWithDescriptions++;
              }

              if (operation.parameters) {
                operation.parameters.forEach((param) => {
                  totalParameters++;
                  if (
                    param &&
                    typeof param === 'object' &&
                    'description' in param &&
                    param.description
                  ) {
                    parametersWithDescriptions++;
                  }
                });
              }

              Object.values(operation.responses).forEach((response) => {
                totalResponses++;
                if (
                  response &&
                  typeof response === 'object' &&
                  'description' in response &&
                  response.description
                ) {
                  responsesWithDescriptions++;
                }
              });
            }
          });
        }
      });
    }

    if (totalOperations > 0) {
      score += (operationsWithDescriptions / totalOperations) * 8;
      feedback.push(
        `${operationsWithDescriptions}/${totalOperations} operations have descriptions`,
      );
    }

    if (totalParameters > 0) {
      score += (parametersWithDescriptions / totalParameters) * 4;
      feedback.push(
        `${parametersWithDescriptions}/${totalParameters} parameters have descriptions`,
      );
    }

    if (totalResponses > 0) {
      score += (responsesWithDescriptions / totalResponses) * 3;
      feedback.push(
        `${responsesWithDescriptions}/${totalResponses} responses have descriptions`,
      );
    }

    if (totalPaths > 0) {
      score += (pathsWithDescriptions / totalPaths) * 2;
    }

    if (score < maxScore * 0.7) {
      suggestions.push(
        'Add descriptions to all operations, parameters, and responses',
      );
      suggestions.push(
        'Use meaningful descriptions that explain the purpose and behavior',
      );
    }

    return {
      name: 'Descriptions & Documentation',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Paths & Operations (15 points)
   * Evaluates naming conventions and CRUD patterns
   */
  scorePathsAndOperations(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 15;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (!document.paths) {
      suggestions.push('Define API paths and operations');
      return {
        name: 'Paths & Operations',
        score: 0,
        maxScore,
        percentage: 0,
        feedback: ['No paths defined'],
        suggestions,
      };
    }

    const paths = Object.keys(document.paths);
    const pathCount = paths.length;

    // Check naming conventions
    let wellNamedPaths = 0;
    let crudPaths = 0;
    const pathPatterns = new Set<string>();

    paths.forEach((path) => {
      // Check for RESTful naming (nouns, lowercase, hyphens)
      const pathSegments = path
        .split('/')
        .filter((segment) => segment && !segment.startsWith('{'));
      let isWellNamed = true;

      pathSegments.forEach((segment) => {
        if (
          segment.includes('_') ||
          /[A-Z]/.test(segment) ||
          !/^[a-z0-9-]+$/.test(segment)
        ) {
          isWellNamed = false;
        }
      });

      if (isWellNamed) {
        wellNamedPaths++;
      }

      const pathItem = document.paths[path];
      if (pathItem) {
        const methods = Object.keys(pathItem).filter((key) =>
          ['get', 'post', 'put', 'patch', 'delete'].includes(key),
        );

        if (methods.length > 0) {
          const normalizedPath = path.replace(/\{[^}]+\}/g, '{id}');
          pathPatterns.add(normalizedPath);

          if (methods.includes('get') && methods.includes('post')) {
            crudPaths++;
          }
        }
      }
    });

    score += (wellNamedPaths / pathCount) * 7;
    feedback.push(
      `${wellNamedPaths}/${pathCount} paths follow RESTful naming conventions`,
    );

    if (crudPaths > 0) {
      score += Math.min(5, crudPaths * 2);
      feedback.push(`Found ${crudPaths} CRUD-pattern endpoints`);
    }

    const overlappingPaths = paths.length - pathPatterns.size;
    if (overlappingPaths === 0) {
      score += 3;
      feedback.push('No overlapping or redundant paths detected');
    } else {
      feedback.push(
        `${overlappingPaths} potentially overlapping paths detected`,
      );
      suggestions.push('Review path structure for redundancy');
    }

    if (score < maxScore * 0.6) {
      suggestions.push(
        'Use RESTful naming conventions (lowercase, hyphens, nouns)',
      );
      suggestions.push('Implement consistent CRUD operations for resources');
    }

    return {
      name: 'Paths & Operations',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Response Codes (15 points)
   * Evaluates appropriate use of HTTP status codes
   */
  scoreResponseCodes(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 15;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (!document.paths) {
      return {
        name: 'Response Codes',
        score: 0,
        maxScore,
        percentage: 0,
        feedback: ['No paths defined'],
        suggestions: ['Define API operations with proper response codes'],
      };
    }

    let operationsWithSuccess = 0;
    let operationsWithErrors = 0;
    let operationsWithMultipleResponses = 0;
    let totalOperations = 0;
    const statusCodesUsed = new Set<string>();

    Object.values(document.paths).forEach((pathItem) => {
      if (pathItem) {
        const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
        methods.forEach((method) => {
          const operation = pathItem[method];
          if (operation) {
            totalOperations++;
            const responses = Object.keys(operation.responses);
            const responseCount = responses.length;

            responses.forEach((code) => statusCodesUsed.add(code));

            const hasSuccess = responses.some((code) => code.startsWith('2'));
            if (hasSuccess) {
              operationsWithSuccess++;
            }

            const hasError = responses.some(
              (code) => code.startsWith('4') || code.startsWith('5'),
            );
            if (hasError) {
              operationsWithErrors++;
            }

            if (responseCount > 1) {
              operationsWithMultipleResponses++;
            }
          }
        });
      }
    });

    if (totalOperations > 0) {
      score += (operationsWithSuccess / totalOperations) * 6;
      score += (operationsWithErrors / totalOperations) * 6;
      score += (operationsWithMultipleResponses / totalOperations) * 3;

      feedback.push(
        `${operationsWithSuccess}/${totalOperations} operations define success responses`,
      );
      feedback.push(
        `${operationsWithErrors}/${totalOperations} operations define error responses`,
      );
      feedback.push(
        `${operationsWithMultipleResponses}/${totalOperations} operations define multiple response codes`,
      );
    }

    const appropriateSuccessCodes = ['200', '201', '202', '204'];
    const appropriateErrorCodes = [
      '400',
      '401',
      '403',
      '404',
      '409',
      '422',
      '500',
    ];

    const hasAppropriateSuccess = appropriateSuccessCodes.some((code) =>
      statusCodesUsed.has(code),
    );
    const hasAppropriateErrors = appropriateErrorCodes.some((code) =>
      statusCodesUsed.has(code),
    );

    if (hasAppropriateSuccess && hasAppropriateErrors) {
      feedback.push('Uses appropriate HTTP status codes');
    } else {
      suggestions.push(
        'Use standard HTTP status codes (200, 201, 400, 404, 500, etc.)',
      );
    }

    if (score < maxScore * 0.5) {
      suggestions.push(
        'Define both success and error responses for all operations',
      );
      suggestions.push(
        'Use specific status codes rather than just 200 and 500',
      );
    }

    return {
      name: 'Response Codes',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Examples & Samples (10 points)
   * Evaluates presence of examples in requests and responses
   */
  scoreExamples(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 10;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (!document.paths) {
      return {
        name: 'Examples & Samples',
        score: 0,
        maxScore,
        percentage: 0,
        feedback: ['No paths defined'],
        suggestions: ['Add request and response examples'],
      };
    }

    let operationsWithRequestExamples = 0;
    let operationsWithResponseExamples = 0;
    let totalOperationsWithBodies = 0;
    let totalResponses = 0;

    Object.values(document.paths).forEach((pathItem) => {
      if (pathItem) {
        const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
        methods.forEach((method) => {
          const operation = pathItem[method];
          if (operation) {
            if (
              operation.requestBody &&
              typeof operation.requestBody === 'object' &&
              'content' in operation.requestBody
            ) {
              totalOperationsWithBodies++;
              const hasRequestExample = Object.values(
                operation.requestBody.content,
              ).some((mediaType) => mediaType.example || mediaType.examples);
              if (hasRequestExample) {
                operationsWithRequestExamples++;
              }
            }

            Object.values(operation.responses).forEach((response) => {
              if (
                response &&
                typeof response === 'object' &&
                'content' in response
              ) {
                totalResponses++;
                const hasResponseExample = Object.values(
                  response.content || {},
                ).some((mediaType) => mediaType.example || mediaType.examples);
                if (hasResponseExample) {
                  operationsWithResponseExamples++;
                }
              }
            });
          }
        });
      }
    });

    if (totalOperationsWithBodies > 0) {
      score += (operationsWithRequestExamples / totalOperationsWithBodies) * 5;
      feedback.push(
        `${operationsWithRequestExamples}/${totalOperationsWithBodies} request bodies have examples`,
      );
    }

    if (totalResponses > 0) {
      score += (operationsWithResponseExamples / totalResponses) * 5;
      feedback.push(
        `${operationsWithResponseExamples}/${totalResponses} responses have examples`,
      );
    }

    if (score < maxScore * 0.3) {
      suggestions.push('Add examples to request bodies and response content');
      suggestions.push(
        'Examples help developers understand expected data formats',
      );
    }

    return {
      name: 'Examples & Samples',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Security (10 points)
   * Evaluates security scheme definitions and usage
   */
  scoreSecurity(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 10;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    const securitySchemes = document.components?.securitySchemes || {};
    const schemeCount = Object.keys(securitySchemes).length;

    if (schemeCount > 0) {
      score += Math.min(5, schemeCount * 2);
      feedback.push(`Found ${schemeCount} security scheme(s) defined`);
    } else {
      suggestions.push('Define security schemes in components.securitySchemes');
    }

    if (document.security && document.security.length > 0) {
      score += 3;
      feedback.push('Global security requirements defined');
    }

    let operationsWithSecurity = 0;
    let totalOperations = 0;

    if (document.paths) {
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
          methods.forEach((method) => {
            const operation = pathItem[method];
            if (operation) {
              totalOperations++;
              if (operation.security) {
                operationsWithSecurity++;
              }
            }
          });
        }
      });
    }

    if (totalOperations > 0 && operationsWithSecurity > 0) {
      score += (operationsWithSecurity / totalOperations) * 2;
      feedback.push(
        `${operationsWithSecurity}/${totalOperations} operations have specific security requirements`,
      );
    }

    if (score === 0) {
      suggestions.push('Implement authentication and authorization schemes');
      suggestions.push('Consider API keys, OAuth2, or JWT tokens');
    }

    return {
      name: 'Security',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }

  /**
   * Score Best Practices (10 points)
   * Evaluates versioning, servers, tags, and component reuse
   */
  scoreBestPractices(document: OpenAPIV3.Document): CriteriaScore {
    const maxScore = 10;
    let score = 0;
    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (document.servers && document.servers.length > 0) {
      score += 2;
      feedback.push(`${document.servers.length} server(s) defined`);
    } else {
      suggestions.push('Define servers array with API base URLs');
    }

    if (document.info.version && document.info.version !== '1.0.0') {
      score += 2;
      feedback.push(`API version: ${document.info.version}`);
    }

    let operationsWithTags = 0;
    let totalOperations = 0;

    if (document.paths) {
      Object.values(document.paths).forEach((pathItem) => {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
          methods.forEach((method) => {
            const operation = pathItem[method];
            if (operation) {
              totalOperations++;
              if (operation.tags && operation.tags.length > 0) {
                operationsWithTags++;
              }
            }
          });
        }
      });
    }

    if (totalOperations > 0) {
      score += (operationsWithTags / totalOperations) * 3;
      feedback.push(
        `${operationsWithTags}/${totalOperations} operations have tags`,
      );
    }

    const components = document.components || {};
    const componentTypes = [
      'schemas',
      'responses',
      'parameters',
      'examples',
      'requestBodies',
      'headers',
    ];
    const componentsWithContent = componentTypes.filter(
      (type) =>
        components[type as keyof typeof components] &&
        Object.keys(components[type as keyof typeof components] || {}).length >
          0,
    );

    if (componentsWithContent.length > 1) {
      score += 2;
      feedback.push(
        `Uses ${componentsWithContent.length} component types for reusability`,
      );
    }

    if (document.externalDocs) {
      score += 1;
      feedback.push('External documentation referenced');
    }

    if (score < maxScore * 0.4) {
      suggestions.push('Add tags to organize operations');
      suggestions.push('Use components for reusable elements');
      suggestions.push('Define multiple servers for different environments');
    }

    return {
      name: 'Best Practices',
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback,
      suggestions,
    };
  }
}

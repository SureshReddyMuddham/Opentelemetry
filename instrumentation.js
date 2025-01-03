// Node SDK and auto-instrumentations package
/*
Run these commands to install required dependencies:
npm install --save @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-proto \
  @opentelemetry/exporter-metrics-otlp-http
*/

// Import dependencies
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'; // Use OTLP HTTP
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources'; // Import Resource
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'; // Import Semantic Resource Attributes
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/otel-log.log' })
  ]
});

// Configure OpenTelemetry SDK with Service Name
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'test-node-app', // Set the service name
  }),
  traceExporter: new OTLPTraceExporter({
    // Default URL for OTLP traces
    url: 'http://0.0.0.0:4318/v1/traces',
    // Optional custom headers
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      // Default URL for OTLP metrics
      url: 'http://0.0.0.0:4318/v1/metrics',
      headers: {},
      concurrencyLimit: 1, // Optional limit on pending requests
    }),
  }),
  // Auto-instrumentations for common libraries
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK
sdk.start()
//  .then(() => logger.info('OpenTelemetry SDK initialized with service name: test node app'))
//  .catch((error) => logger.error('Error initializing OpenTelemetry SDK', error));

// Export the SDK for use in other modules (optional)
export default sdk;

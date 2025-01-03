'use strict'

import process from 'process';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'; // OTLP exporter for traces
//import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Configure the OTLP exporter for sending traces to OpenTelemetry collector
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // URL of your OpenTelemetry Collector (ensure your collector is running)
  headers: {} // Optional headers (authentication, etc.)
});

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service', // Set service name
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()] // Enable auto-instrumentations
});

// Initialize the SDK and start collecting traces
sdk.start()
//  .then(() => console.log('OpenTelemetry SDK initialized with service name: my-service'))
//  .catch((error) => console.error('Error initializing OpenTelemetry SDK', error));

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

// OpenTelemetry Collector Metrics Exporter for Node.js
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

const collectorOptions = {
  url: 'http://localhost:4318/v1/metrics', // Optional, defaults to http://localhost:4318/v1/metrics
  concurrencyLimit: 1, // Optional limit on pending export requests
};

const metricExporter = new OTLPMetricExporter(collectorOptions);
const meterProvider = new MeterProvider({});

meterProvider.addMetricReader(new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 1000,
}));

// Start recording data
const meter = meterProvider.getMeter('example-meter');
const counter = meter.createCounter('metric_name');
counter.add(10, { 'key': 'value' });

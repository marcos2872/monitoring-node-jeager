import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import { env } from './env'; // use your method of getting the environment variable

if (env.MONITORING.toLowerCase().trim() === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const traceExporter = new OTLPTraceExporter({
    url: env.TRACE_EXPORTER_URL,
  });

  const sdk = new opentelemetry.NodeSDK({
    traceExporter,
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'project-name',
      [ATTR_SERVICE_VERSION]: '1.0',
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: env.METRIC_READER_URL,
      }),
      exportIntervalMillis: 5000,
    }),
    instrumentations: [getNodeAutoInstrumentations(), new PgInstrumentation()],
  });

  sdk.start();

  process.on('SIGTERM', async () => {
    await sdk.shutdown();
    console.log('OpenTelemetry finalizado.');
    process.exit(0);
  });
}

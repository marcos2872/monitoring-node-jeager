/* eslint-disable @typescript-eslint/no-misused-promises */
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';


diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4317',
});

const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'api',
    [ATTR_SERVICE_VERSION]: '1.0',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations(), new PrismaInstrumentation()],
});

  sdk.start();

process.on('SIGTERM', async () => {
  await sdk.shutdown();
  console.log('OpenTelemetry finalizado.');
  process.exit(0);
});

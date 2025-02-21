# Tools for monitoring node applications

## Monitoring Setup with OpenTelemetry, Jaeger, and Prometheus

This project implements a monitoring service for a **Node.js** application using **OpenTelemetry**, **Jaeger**, and **Prometheus**. The goal is to collect traces, metrics, and performance data from services.

### 📌 Requirements and Installation

Before starting, you need to install OpenTelemetry packages in your project:

```sh
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-grpc \
            @opentelemetry/exporter-metrics-otlp-proto \
            @opentelemetry/instrumentation-pg \
            @opentelemetry/resources \
            @opentelemetry/sdk-metrics \
            @opentelemetry/semantic-conventions

```

### 📚 File Structure

-   **`tracing.ts`** → OpenTelemetry initialization file (must be the **first** import in the project).
-   **`docker-compose.yml`** → Defines Jaeger, OpenTelemetry Collector, and Prometheus services.
-   **`otel-collector-config.yml`** → OpenTelemetry Collector configuration.
-   **`prometheus.yml`** → Prometheus configuration.

### 🔹 `tracing.ts`: OpenTelemetry Configuration

The `tracing.ts` file initializes OpenTelemetry in the project. It **must be the first import** to ensure automatic instrumentation works correctly.

```typescript
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import { env } from './env'; // Load environment variables

if (env.MONITORING.toLowerCase().trim() === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const traceExporter = new OTLPTraceExporter({
    url: env.TRACE_EXPORTER_URL,
  });

  const sdk = new opentelemetry.NodeSDK({
    traceExporter,
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'fit-api',
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
    console.log('OpenTelemetry shut down.');
    process.exit(0);
  });
}

```

#### 🛠️ How to Configure

1.  **Set environment variables** in `.env`:
    
    ```sh
    MONITORING=true
    TRACE_EXPORTER_URL=http://localhost:4317
    METRIC_READER_URL=http://localhost:4318/v1/metrics
    
    ```
    
2.  **Import `tracing.ts` at the beginning of the project**:
    
    ```typescript
    import './tracing'; // Mandatory import before any other module
    import express from 'express';
    
    const app = express();
    app.listen(3000, () => console.log('Server running on port 3000'));
    
    ```
    

### 🚀 How to Run

1.  **Start the services** using Docker:
    
    ```sh
    docker-compose up -d
    
    ```
    
2.  **Run the Node.js application**:
    
    ```sh
    npm start
    
    ```
    

### 📰 Accessing Monitoring Tools

-   **Jaeger UI** (Traces): [`http://localhost:8081`](http://localhost:8081/)
-   **Prometheus UI** (Metrics): [`http://localhost:9090`](http://localhost:9090/)

### 📃 Notes

-   `tracing.ts` must be **the first import** in the code for proper instrumentation.
-   OpenTelemetry collects and sends metrics and traces to **Jaeger** and **Prometheus** via **OpenTelemetry Collector**.
-   Prometheus automatically collects metrics from OpenTelemetry Collector.

----------

With this setup, your application will have **full monitoring**, aiding in **observability and performance issue detection**. 🚀

<br>
<br>

## CPU Profiling with Node.js Inspector

This project sets up CPU profiling for a **Node.js** application using the built-in **Inspector API**. The goal is to capture CPU performance data and generate a profile that can be analyzed with developer tools such as Chrome DevTools.

### 📌 Requirements and Installation

No additional dependencies are required, as **Node.js Inspector** is built into Node.js. Ensure you have Node.js installed on your system.

### 📚 File Structure

-   **`profiler.ts`** → Initializes and runs the CPU profiler (must be imported in the main project file).

### 🔹 `profiler.ts`: CPU Profiling Configuration

The `profiler.ts` file starts a CPU profile session, captures performance data for **10 seconds**, and saves the results to a file (`profile.cpuprofile`).

```typescript
import { writeFileSync } from 'node:fs';
import { Session } from 'node:inspector';

const session = new Session();
session.connect();
session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    setTimeout(() => {
      session.post('Profiler.stop', (err, { profile }) => {
        writeFileSync('./profile.cpuprofile', JSON.stringify(profile));

        session.disconnect();
      });
    }, 10000);
  });
});

```

#### 🛠️ How to Configure

1.  **Ensure Node.js is installed** (version 10+ recommended).
2.  **Save the above script** as `profiler.ts` in your project.
3.  **Import `profiler.ts` in the main file of your project**:
    
    ```typescript
    import './profiler'; // Mandatory import for profiling to work
    
    ```
    

### 🚀 How to Run

1.  **Run the profiler script**:
    
    ```sh
    npm start
    
    ```
    
2.  **Wait 10 seconds** for profiling to complete.
3.  **Analyze the profile**:
    -   Open **Chrome DevTools** (`chrome://inspect` in Chrome).
    -   Navigate to **Profiler** → **Load Profile**.
    -   Select `profile.cpuprofile` for analysis.
    -   Alternatively, open [cpupro](https://discoveryjs.github.io/cpupro/#) to visualize the profile.

### 📃 Notes

-   This profiling setup helps analyze CPU bottlenecks and optimize performance.
-   The generated `.cpuprofile` file can be inspected in Chrome DevTools.
-   Adjust the `setTimeout` duration to capture a longer or shorter profiling session.
-   **Ensure `profiler.ts` is imported in the main project file** so profiling starts automatically.

----------

With this setup, you can efficiently capture and analyze CPU performance data for your Node.js application. 🚀

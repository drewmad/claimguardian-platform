import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities/index.js';
import { logger } from './lib/logger.js';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = 'florida-data-etl';

async function run() {
  try {
    const connection = await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    });

    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve('./workflows/index.js'),
      activities,
      enableLoggingInReplay: true,
    });

    logger.info(`ETL Worker starting on task queue: ${TASK_QUEUE}`);
    await worker.run();
  } catch (error) {
    logger.error('Failed to start ETL worker', { error });
    process.exit(1);
  }
}

run().catch((err) => {
  logger.error('Unhandled worker error', { error: err });
  process.exit(1);
});
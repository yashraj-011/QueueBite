import app from './app.js';
import { sweepMissedOrders } from './jobs/missedOrdersJob.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 QueueBite Backend API listening on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   API Base URL: http://localhost:${PORT}/api/v1`);

  // Run missed orders job periodically (every 5 minutes)
  setInterval(sweepMissedOrders, 5 * 60 * 1000);
});

export default server;

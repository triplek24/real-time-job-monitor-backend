import app from './app';
import { startJobWorker } from './modules/jobs/jobWorker';
import { startHeartbeat } from './realtime/heartbeat';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start background processes
  startJobWorker();
  startHeartbeat();
});
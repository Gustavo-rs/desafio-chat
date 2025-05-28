import { Router } from 'express';
import { ScalingService } from '../services/scalingService';
import { authenticate } from '../middlewares/auth';

const router = Router();
const scalingService = ScalingService.getInstance();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await scalingService.getSystemStats();
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics'
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    await scalingService.checkRateLimit('health-check', 'ping', 1, 1000);
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        server: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cleanup', authenticate, async (req, res) => {
  try {
    await scalingService.cleanupExpiredData();
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired data'
    });
  }
});

export default router;
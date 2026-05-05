import { sequelize, connectDatabase } from '../config/database';
import { logger } from '../config/logger';
import '../models';

async function reset() {
  try {
    await connectDatabase();
    await sequelize.drop();
    logger.info('✅ All tables dropped');
    await sequelize.sync({ force: true });
    logger.info('✅ Database reset complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

reset();

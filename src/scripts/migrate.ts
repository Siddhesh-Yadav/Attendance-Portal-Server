import { sequelize, connectDatabase } from '../config/database';
import { logger } from '../config/logger';
import '../models';

async function migrate() {
  try {
    await connectDatabase();
    await sequelize.sync({ alter: true });
    logger.info('✅ Database migration complete (sync with alter)');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

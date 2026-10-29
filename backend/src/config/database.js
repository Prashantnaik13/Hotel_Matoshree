import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;
if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'hotel_pos_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      define: { underscored: false, timestamps: true, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || './database.sqlite',
    logging: false,
    define: { timestamps: true }
  });
}

export default sequelize;

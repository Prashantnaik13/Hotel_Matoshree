import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import sequelize from './config/database.js';
import './models/index.js';

const PORT = process.env.PORT || 5000;

async function start(){
  try{
    await sequelize.authenticate();
    console.log('✓ Database connected ('+ (process.env.DB_DIALECT||'sqlite') +')');
    await sequelize.sync(); // non-force sync for dev
    console.log('✓ Models synced');
    app.listen(PORT, '0.0.0.0', ()=> console.log(`✓ Server running on http://0.0.0.0:${PORT}`));
  }catch(e){
    console.error('Failed to start', e);
    process.exit(1);
  }
}
start();

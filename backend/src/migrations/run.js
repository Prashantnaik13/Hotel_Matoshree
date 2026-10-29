import sequelize from '../config/database.js';
import '../models/index.js';

async function run(){
  try{
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync({ force: true });
    console.log('All tables synced (force:true)');
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
}
run();

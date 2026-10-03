const { initMySQL, getDatabaseStatus } = require('../config/db');

async function main() {
  console.log('========================================================');
  console.log('🚀 Initializing E-Commerce Major Project Database...');
  console.log('========================================================');
  
  const success = await initMySQL();
  const status = getDatabaseStatus();

  console.log('\n📊 Database Status:', status);
  if (success) {
    console.log('\n✨ Database initialization completed successfully!');
    console.log('🔑 Default Accounts Ready:');
    console.log('   👑 Admin:    admin@ecommerce.com / admin123');
    console.log('   👤 Customer: john@example.com   / customer123');
  } else {
    console.log('\nℹ️ Running in resilient local mode. To connect live MySQL, ensure your MySQL service (e.g. XAMPP/WAMP/MySQL Workbench) is running and credentials in .env are correct.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});

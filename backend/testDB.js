import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'duoc',
  database: 'urban_drip',
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err);
    process.exit(1);
  }
  console.log('Conexión exitosa a la base de datos MySQL');
  connection.end();
});

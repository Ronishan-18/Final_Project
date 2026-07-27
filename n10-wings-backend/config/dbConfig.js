const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export const getDbConfig = (env = process.env) => {
  const host = env.MYSQLHOST || env.DB_HOST || 'localhost';
  const user = env.MYSQLUSER || env.DB_USER || 'root';
  const password = env.MYSQLPASSWORD || env.DB_PASSWORD || '';
  const database = env.MYSQLDATABASE || env.DB_NAME || 'esports_db';
  const port = Number(env.MYSQLPORT || env.DB_PORT || 3306);

  const ssl = env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : (!LOCAL_HOSTS.has(host) ? { rejectUnauthorized: false } : false);

  return {
    host,
    user,
    password,
    database,
    port,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
  };
};

const config = {
  user: 'sa',
  password: 'p@ssw0rd',
  server: '21006631jason\\SQLEXPRESS' , 
  database: 'ArticleDB' ,
  options: {
      trustedConnection: true,
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: true,
    },
  //   pool: {
  //     max: 20,
  //     min: 10,
  //     idleTimeoutMillis: 30000
  // }
};

const port = 5000;

const key = 'lkeflkwekvkcxxcqwqwlkxcpxcodx';

const status = {
  OK: 200,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  PreconditionFailed: 412,
  SystemError: 500
};

module.exports = {config, port, key, status} ;
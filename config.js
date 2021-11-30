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
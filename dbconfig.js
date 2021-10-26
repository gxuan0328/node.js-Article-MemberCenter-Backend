var config = {
  user: 'sa',
  password: 'p@ssw0rd',
  server: 'LAPTOP-HSUAN\\SQLEXPRESS' , 
  database: 'ArticleDB' ,
  options: {
      trustedConnection: true,
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: true,
    },
};

module.exports = config ;
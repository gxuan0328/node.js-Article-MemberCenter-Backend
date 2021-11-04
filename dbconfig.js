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

// let pool = sql.connect(config);

// module.exports = pool ;

//connect拆到dbconfig做，就不需要不斷重複連線

// const pool = require('./dbconfig');
// app.get('/', async(req, res) => {
//     try{

//         let data = await (await pool).query('select * from Articles');
//         res.send({StatusCode: 200, Message: 'finish search article list', Data: data.recordset});
//         await (await pool).close();
//     }
//     catch(error){
//         console.log(error);
//         res.send({StatusCode: 500, Message: error, Data: {}});
//     }
// });
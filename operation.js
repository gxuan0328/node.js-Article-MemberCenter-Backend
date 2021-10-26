const sql = require('mssql');
const config = require('./dbconfig');

async function getData(req,res)  {
    try{
        let pool = await sql.connect(config);
        let data = await pool.request().query('select StudentName from Student');
        console.log(data.recordset);
        res.send(data.recordset); 
    }
    catch(error){
        console.log(error);
    }
}

async function getUser(req,res)  {
    try{
        let name = req.params.name;
        console.log('HI ',name);
        let pool = await sql.connect(config);
        let data = await pool.request().query(`select count(*) from [User] where UserName='${name}'`);
        console.log(data.recordset);
        console.log(data.recordset.UserName);
        console.log(data.recordset[0]);
        console.log(data.recordset[0].UserName);
        res.send(data.recordset); 
        pool.close();
    }
    catch(error){
        console.log(error);
    }
}

module.exports = {getData, getUser};
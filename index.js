const express = require('express');
const app = express();
const cors = require('cors');
const sql = require('mssql');
const config = require('./dbconfig');
const port = 5000;


app.use(cors());
app.use(express.json());

    // let pool = await sql.connect(config);
    // let data = await pool.query();


app.get('/', async(req, res) => {
    try{
       let pool = await sql.connect(config);
        let data = await pool.query('select * from Articles');
        res.send({StatusCode: 200, Message: 'finish search article list', Data: data.recordset});
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.get('/detail/:id', async(req, res) => {
    try{
        let id = req.params.id;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from Articles where id=${id}`);
        if(data.rowsAffected[0] === 1){
            res.send({StatusCode: 200, Message: 'finish get article', Data: data.recordset[0]});
        }
        else{
            res.send({StatusCode: 404, Message: 'this article not exist', Data: {}});
        }
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }

});

app.put('/detail/:id', async(req, res) => {
    try{
        let article = req.body;
        let id = Number(req.params.id);
        let pool = await sql.connect(config);
        if(id === article.id){
            await pool.query(`update Articles set title='${article.title}', author='${article.author}', content='${article.content}' where id=${article.id}`);
            res.send({StatusCode: 200, Message: 'finish update', Data: {}});
        }
        else{
            res.send({StatusCode: 404, Message: 'update failed, title id is not equal to  body id', Data: {}});
        }
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.delete('/:id', async(req, res) => {
    try{
        let id = req.params.id;
        let pool = await sql.connect(config);
        let data = await pool.query(`delete Articles where id=${id}`);
        if(data.rowsAffected[0] === 1){
            res.send({StatusCode: 200, Message:'finish delete', Data: {}});
        }
        else{
            res.send({StatusCode: 404, Message:'the article isn\'t exist', Data: {}});
        }
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.post('/', async(req, res) => {
    try{
        let article = req.body;
        let pool = await sql.connect(config);
        console.log(article.title !== '' && article.author !== '' && article.content !== '');
        if(article.title !== '' && article.author !== '' && article.content !== ''){
            await pool.query(`insert into Articles(title, author, content) values ('${article.title}', '${article.author}', '${article.content}')`);
            res.send({StatusCode: 200, Message:'finish create', Data: {}});
        }
        else{
            res.send({StatusCode: 404, Message:'create failed, missing some value', Data: article});
        }
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.get('/search/:title', async(req, res) => {
    try{
        let title = req.params.title;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from Articles where title like '%${title}%'`);
        res.send(data.recordset);
        console.log(title);
        console.log(data.recordset);
        console.log({StatusCode: 200, Message: 'finish search term', Data: data.recordset});
        pool.close();

    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.get('/login', async(req, res) => {
    try{
        let username = req.query.UserName;
        let password = req.query.Password;
        let result = false;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from [User] where UserName='${username}' and Password='${password}'`);
    
            if(data.recordset[0] != undefined) { 
                result=true;
                console.log(result);
                console.log(data.recordset[0]);
                res.send({StatusCode: 200, Message: 'login success', Data: data.recordset[0]});
            }
            else{
                console.log(result);
                res.send({StatusCode: 404, Message: 'incorrect username or password', Data: data.recordset[0]});
            }
        pool.close();
    }
    catch(error){
        console.log(error);
        res.send({StatusCode: 500, Message: error, Data: {}});
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


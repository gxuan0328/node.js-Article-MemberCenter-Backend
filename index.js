const express = require('express');
const app = express();
const cors = require('cors');
const sql = require('mssql');
const config = require('./dbconfig');
// const operation = require('./operation');
const port = 5000;
app.use(cors());
app.use(express.json());

// app.get('/getData', (req, res) => {
//         // connect to your database
//         sql.connect(config, function (err) {
//             if (err) console.log(err);
    
//             // create Request object
//             var request = new sql.Request();
               
//             // query to the database and get the records
//             request.query('select * from Student', function (err, recordset) {
                
//                 if (err) console.log(err);
    
//                 // send records as a response
//                 res.send(recordset);
                
//             });
//         });
// });

// //test api
// app.get('/name', operation.getData);
// app.get('/user/:name', operation.getUser);

app.get('/', (req, res) => {
    sql.connect(config, function () {
        let request = new sql.Request();
        request.query('select * from Articles', function (err, recordset) {
            res.send({StatusCode: 200, Message: 'finish search article list', Data: recordset.recordset});
        });  
    });
});
app.get('/detail/:id', (req, res) => {
    sql.connect(config, function () {
        let id = req.params.id;
        let request = new sql.Request();
        request.query(`select * from Articles where id=${id}`, function (err, recordset) {
            res.send({StatusCode: 200, Message: 'finish get article', Data: recordset.recordset[0]});
        });
    });
});
app.put('/', (req, res) => {
    sql.connect(config, function () {
        let article = req.body;
        console.log(article);
        let request = new sql.Request();
        request.query(`update Articles set title='${article.title}', author='${article.author}', content='${article.content}' where id=${article.id}`);
        res.send({StatusCode: 200, Message: 'finish update', Data: {}});
    });
});
app.delete('/:id', (req, res) => {
    sql.connect(config, function () {
        let id = req.params.id;
        let request = new sql.Request();
        request.query(`delete Articles where id=${id}`);
        res.send({StatusCode: 200, MESSAGE:'finish delete', Data: {}});
    });
});
app.post('/', (req, res) => {
    sql.connect(config, function () {
        let article = req.body;
        console.log(article);
        let request = new sql.Request();
        request.query(`insert into Articles(title, author, content) values ('${article.title}', '${article.author}', '${article.content}') select SCOPE_IDENTITY() as id`, function (err, recordset) {
            article.id = recordset.recordset[0].id;
            res.send({StatusCode: 200, MESSAGE:'finish create', Data: article});
        });

        
    });
});
app.get('/search/:title', (req, res) => {
    sql.connect(config, function () {
        let title = req.params.title;
        let request = new sql.Request();
        request.query(`select * from Articles where title like '%${title}%'`, function (err, recordset) {
            res.send(recordset.recordset);
            console.log(title);
            console.log(recordset.recordset);
            console.log({StatusCode: 200, Message: 'finish search term', Data: recordset.recordset});
        });
    });
});
app.get('/getUser', (req, res) => {
    sql.connect(config, function () {
        let username = req.query.UserName;
        let password = req.query.Password;
        let result = false;
        console.log(username,' ',password);
        let request = new sql.Request();
        request.query(`select * from [User] where UserName='${username}' and Password='${password}'`, function (err, recordset) {
            console.log(recordset);
            if(recordset.recordset[0] != undefined) { 
                result=true;
                console.log(result);
                console.log(recordset.recordset[0]);
                res.send({StatusCode: 200, Message: 'finish get article', Data: recordset.recordset[0]});
            }
            else{
                console.log(result);
                res.send({StatusCode: 400, Message: 'get article failed', Data: recordset.recordset[0]});
            }
            
        });
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


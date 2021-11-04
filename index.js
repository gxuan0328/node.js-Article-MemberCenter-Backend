const express = require('express');
const app = express();
const cors = require('cors');
const sql = require('mssql');
const jwt = require('jsonwebtoken');
const config = require('./dbconfig');
const port = 5000;
const KEY = 'lkeflkwekvkcxxcqwqwlkxcpxcodx';
// const KEY2 = 'lkeflkwekvkcxxcqwqwlkxcpxcod1';

const authenticateToken = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token === null) {
            res.send({ StatusCode: 401, Message: 'token isn\'t exist, login first', Data: {} });
        }
        jwt.verify(token, KEY, async (err, decode) => {
            if (err) {
                console.log(err);
                res.send({ StatusCode: 403, Message: 'invalid token', Data: {} });
            }
            else {
                let pool = await sql.connect(config);
                let data = await pool.query(`select token from [User] where ID='${decode.ID}'`);
                pool.close();
                console.log(data.recordset[0].token === token);
                if (data.recordset[0].token === token) {
                    console.log('decode: ', decode);
                    next();
                }
                else {
                    res.send({ StatusCode: 403, Message: 'sign in from other place, please login again', Data: {} });
                }
            }
        });
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }


};

const operationAuthority = async (req, res, next) => {
    try {
        let id = Number(req.params.id);
        let token = req.headers.authorization;
        let decode = jwt.verify(token, KEY);
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from Articles where ID=${id} and User_ID=${decode.ID}`);
        pool.close();
        if (data.rowsAffected[0] === 1 || decode.UserStatus === 2) {
            console.log('can edit');
            next();
        }
        else {
            console.log('do not have authority');
            res.send({ StatusCode: 403, Message: 'don\'t have the operation authority', Data: {} });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
};

app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let data = await pool.query('select * from Articles');
        res.send({ StatusCode: 200, Message: 'finish search article list', Data: data.recordset });
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.get('/detail/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from Articles where id=${id}`);
        console.log(data.rowsAffected[0]);
        if (data.rowsAffected[0] === 1) {
            res.send({ StatusCode: 200, Message: 'finish get article', Data: data.recordset[0] });
        }
        else {
            res.send({ StatusCode: 404, Message: 'this article not exist', Data: {} });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }

});

app.put('/detail/:id', authenticateToken, operationAuthority, async (req, res) => {
    try {
        let article = req.body;
        let id = Number(req.params.id);
        let pool = await sql.connect(config);
        if (id === article.ID) {
            await pool.query(`update Articles set Title='${article.Title}', User_ID='${article.User_ID}', Author='${article.Author}', Content='${article.Content}', UpdateDatetime=GETDATE() where id=${article.ID}`);
            res.send({ StatusCode: 200, Message: 'finish update', Data: {} });
        }
        else {
            res.send({ StatusCode: 404, Message: 'update failed, title id is not equal to  body id', Data: {} });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.delete('/:id', authenticateToken, operationAuthority, async (req, res) => {
    try {
        let id = req.params.id;
        let pool = await sql.connect(config);
        let data = await pool.query(`delete Articles where id=${id}`);
        if (data.rowsAffected[0] === 1) {
            res.send({ StatusCode: 200, Message: 'finish delete', Data: {} });
        }
        else {
            res.send({ StatusCode: 404, Message: 'the article isn\'t exist', Data: {} });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.post('/', authenticateToken, async (req, res) => {
    try {
        let article = req.body;
        let pool = await sql.connect(config);
        console.log(article.Title !== '' && article.Author !== '' && article.Content !== '');
        if (article.Title !== '' && article.Author !== '' && article.Content !== '') {
            await pool.query(`insert into Articles(Title, User_ID, Author, Content, CreateDatetime, UpdateDatetime) values ('${article.Title}', '${article.User_ID}','${article.Author}', '${article.Content}', GETDATE(), GETDATE())`);
            res.send({ StatusCode: 200, Message: 'finish create', Data: {} });
        }
        else {
            res.send({ StatusCode: 404, Message: 'create failed, missing some value', Data: article });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.get('/search/:title', async (req, res) => {
    try {
        let title = req.params.title;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from Articles where title like '%${title}%'`);
        res.send({ StatusCode: 200, Message: 'finish search term', Data: data.recordset });
        console.log({ StatusCode: 200, Message: 'finish search term', Data: data.recordset });
        pool.close();

    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.put('/login', async (req, res) => {
    try {
        let username = req.body.UserName;
        let password = req.body.Password;
        let pool = await sql.connect(config);
        let data = await pool.query(`select ID, UserName, UserStatus from [User] where UserName='${username}' and Password='${password}'`);
        if (data.recordset[0] !== undefined) {
            let token = jwt.sign(data.recordset[0], KEY, { expiresIn: '1h' });
            await pool.query(`update [User] set Token='${token}' where ID='${data.recordset[0].ID}'`);
            res.send({ StatusCode: 200, Message: 'login success', Data: token });
        }
        else {
            console.log(result);
            res.send({ StatusCode: 404, Message: 'incorrect username or password', Data: data.recordset[0] });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});
app.post('/sign', async (req, res) => {
    try {
        let username = req.body.UserName;
        let password = req.body.Password;
        let pool = await sql.connect(config);
        let data = await pool.query(`select * from [User] where UserName='${username}'`);
        if (data.rowsAffected[0] === 1) {
            res.send({ StatusCode: 404, Message: 'username has exist', Data: {} });
        }
        else {
            await pool.query(`insert into [User] (UserName, Password, UserStatus, Token) values('${username}', '${password}', '1', '')`);
            res.send({ StatusCode: 200, Message: 'finish create', Data: {} });
        }
        pool.close();
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: 500, Message: error, Data: {} });
    }
});

app.listen(port, () => console.log(`Article Backend listening on port ${port}`));


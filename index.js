const express = require('express');
const app = express();
const cors = require('cors');
const sql = require('mssql');
const jwt = require('jsonwebtoken');
const { config, port, key, status } = require('./config');
const pool = new sql.ConnectionPool(config);
const connection = pool.connect();


const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (token === undefined) {
            res.send({ StatusCode: status.PreconditionFailed, Message: 'Precondition Failed', Data: null });
        }
        jwt.verify(token, key, async (err, decode) => {
            if (err) {
                console.log(err);
                res.send({ StatusCode: status.Unauthorized, Message: 'Unauthorized', Data: null });
            }
            else {
                await connection;
                const data = await pool.query(`select [Token] from [ArticleDB].[dbo].[Token] where [User_Id]=${decode.Id}`);
                if (data.recordset.length === 1 && data.recordset[0].Token === token) {
                    console.log('decode: ', decode);
                    req.params.token = decode;
                }
                else {
                    res.send({ StatusCode: status.Forbidden, Message: 'Forbidden', Data: null });
                    return;
                }
                next();
            }
        });
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
};


app.use(cors());
app.use(express.json());


app.get('/articleId', async (req, res) => {
    try {
        await connection;
        let articleId = [];
        const data = await pool.query('select [Articles].[Id] from [ArticleDB].[dbo].[Articles]');
         data.recordset.forEach((article) => articleId.push(article.Id));
        res.send({ StatusCode: status.OK, Message: 'OK', Data: articleId });
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.get('/personalArticleId', authenticateToken, async (req, res) => {
    try {
        await connection;
        let articleId = [];
        const token = req.params.token;
        if (token) {
            const data = await pool.query(`select [Articles].[Id] from [ArticleDB].[dbo].[Articles] where [Articles].[User_Id]=${token.Id}`);
            data.recordset.forEach((article) => articleId.push(article.Id));
            res.send({ StatusCode: status.OK, Message: 'OK', Data: articleId });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.get('/list', async (req, res) => {
    try {
        await connection;
        let list = [];
        let articles = [];
        if(req.query.list !== undefined){
            if(typeof req.query.list === 'string'){
                list.push(Number(req.query.list));
            }
            else{
                req.query.list.forEach((index) => list.push(Number(index)));
            }
            for (let id of list) {
                const data = await pool.query(`select [Articles].[Id], [User].[UserName], [Articles].[Title], [Articles].[CreateDatetime] from [ArticleDB].[dbo].[Articles] inner join [ArticleDB].[dbo].[User] on [Articles].[User_Id]=[User].[Id] where [Articles].[Id] = ${id}`);
                if (data.recordset.length === 1) {
                    articles.push(data.recordset[0]);
                }
                else {
                    res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
                }

            }
            res.send({ StatusCode: status.OK, Message: 'OK', Data: articles });
        }
        else {
            res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.get('/detail/:id', async (req, res) => {
    try {
        await connection;
        const id = req.params.id;
        const data = await pool.query(`select [Articles].[Id], [Articles].[Title], [Articles].[User_Id], [User].[UserName], [Articles].[Content], [Articles].[CreateDatetime], [Articles].[UpdateDatetime], [Articles].[LastOrder] from [ArticleDB].[dbo].[Articles] inner join [ArticleDB].[dbo].[User] on [Articles].[User_Id]=[User].[Id] where [Articles].[Id]=${id}`);
        if (data.recordset.length === 1) {
            res.send({ StatusCode: status.OK, Message: 'OK', Data: data.recordset[0] });
        }
        else {
            res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.put('/detail/:id', authenticateToken, async (req, res) => {
    try {
        await connection;
        const article = req.body;
        const token = req.params.token;
        const id = Number(req.params.id);
        if (id === article.Id) {
            const data = await pool.query(`select [Id] from [ArticleDB].[dbo].[Articles] where [Id]=${id} and [User_Id]=${token.Id}`);
            if (data.recordset.length === 1 || token.UserStatus === 2) {
                if (article.Title !== '' && article.Content !== '') {
                    await pool.query(`update [ArticleDB].[dbo].[Articles] set [Title]='${article.Title}', [Content]='${article.Content}', [UpdateDatetime]=GETDATE(), [LastOrder]='${token.Id}' where [Id]=${article.Id}`);
                    res.send({ StatusCode: status.OK, Message: 'OK', Data: null });
                }
                else {
                    res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: null });
                }
            }
            else {
                console.log('do not have authority');
                res.send({ StatusCode: status.Forbidden, Message: 'Forbidden', Data: null });
            }
        }
        else {
            res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await connection;
        const id = req.params.id;
        const token = req.params.token;
        const data = await pool.query(`select [Id] from [ArticleDB].[dbo].[Articles] where [Id]=${id} and [User_Id]=${token.Id}`);
        if (data.recordset.length === 1 || token.UserStatus === 2) {
            const check = await pool.query(`delete [ArticleDB].[dbo].[Articles] where [Id]=${id}`);
            if (check.rowsAffected[0] === 1) {
                res.send({ StatusCode: status.OK, Message: 'OK', Data: null });
            }
            else {
                res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
            }
        }
        else {
            console.log('do not have authority');
            res.send({ StatusCode: status.Forbidden, Message: 'Forbidden', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.post('/article', authenticateToken, async (req, res) => {
    try {
        await connection;
        const article = req.body;
        if ((req.body !== undefined) && (article.Title !== '') && (article.User_Id !== 0) && (article.Content !== '')) {
            data = await pool.query(`insert into [ArticleDB].[dbo].[Articles] ([Title], [User_Id], [Content], [LastOrder]) values ('${article.Title}', '${article.User_Id}', '${article.Content}', '${article.User_Id}')`);
            res.send({ StatusCode: status.OK, Message: 'OK', Data: null });
        }
        else {
            res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: article });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.get('/search', async (req, res) => {
    try {
        await connection;
        const { title, author, fromDate, toDate } = req.query;
        let articleId = [];
        let option = [];
        let name = false;
        let string = '';

        title !== '' ? option.push(`[Title] like '%${title}%'`) : title;
        if (author !== '') {
            const data = await pool.query(`select [User].[Id] from [ArticleDB].[dbo].[User] where [User].[UserName]='${author}'`);
            if (data.recordset.length === 1) {
                name = true;
                option.push(`[User_Id] = ${data.recordset[0].Id}`);
            }
        }
        if(fromDate !== '' || toDate !== ''){
            fromDate !== '' ? option.push(`[CreateDatetime] >= '${fromDate}'`) : fromDate;
            toDate !== '' ? option.push(`[CreateDatetime] <= '${toDate}'`) : toDate;
        }
        option.forEach((item, index) => {
            if (index === 0) {
                string = string.concat(' where ',item);
            }
            else{
                string = string.concat(' and ', item);
            }
        });
        if(string !== ''){
            const data = await pool.query('select [Articles].[Id] from [ArticleDB].[dbo].[Articles]' + string);
            if(data.recordset.length === 0){
                res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: [] });
            }
            else{
                data.recordset.forEach((article) => articleId.push(article.Id));
                res.send({ StatusCode: status.OK, Message: 'OK', Data: articleId });
            }
        }
        else if(!name){

            res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: [] });
        }
        else{
            res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: [] });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.get('/search/:title', async (req, res) => {
    try {
        await connection;
        const title = req.params.title;
        const data = await pool.query(`select [Id], [Title] from [ArticleDB].[dbo].[Articles] where [Title] like '%${title}%'`);
        res.send({ StatusCode: status.OK, Message: 'OK', Data: data.recordset });
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});

app.post('/login', async (req, res) => {
    try {
        await connection;
        const username = req.body.UserName;
        const password = req.body.Password;
        if ((req.body !== undefined) && (username !== '') && (password !== '')) {
            const data = await pool.query(`select [Id], [UserName], [UserStatus] from [ArticleDB].[dbo].[User] where [UserName]='${username}' and Password='${password}'`);
            if (data.recordset.length === 1) {
                const token = jwt.sign(data.recordset[0], key, { expiresIn: '1h' });
                await pool.query(`update [ArticleDB].[dbo].[Token] set [Token]='${token}', [UpdateDatetime]=GETDATE() where [User_Id]='${data.recordset[0].Id}'`);
                res.send({ StatusCode: status.OK, Message: 'OK', Data: token });
            }
            else {
                res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
            }
        }
        else {
            res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: null });
    }
});
app.post('/sign', async (req, res) => {
    try {
        await connection;
        const username = req.body.UserName;
        const password = req.body.Password;
        if ((req.body !== undefined) && (username !== '') && (password !== '')) {
            const data = await pool.query(`select [Id] from [ArticleDB].[dbo].[User] where [UserName]='${username}'`);
            if (data.recordset.length === 1) {
                res.send({ StatusCode: status.NotFound, Message: 'Not Found', Data: null });
            }
            else {
                const user = await pool.query(`insert into [ArticleDB].[dbo].[User] ([UserName], [Password], [UserStatus]) values('${username}', '${password}', '1') select SCOPE_IDENTITY() as Id`);
                if (user.recordset.length === 1) {
                    await pool.query(`insert into [ArticleDB].[dbo].[Token] ([User_Id], [Token]) values('${user.recordset[0].Id}', '')`);
                    res.send({ StatusCode: status.OK, Message: 'OK', Data: null });
                }
            }
        }
        else {
            res.send({ StatusCode: status.BadRequest, Message: 'Bad Request', Data: null });
        }
    }
    catch (error) {
        console.log(error);
        res.send({ StatusCode: status.SystemError, Message: error, Data: {} });
    }
});

app.listen(port, () => console.log(`Article Backend listening on port ${port}`));


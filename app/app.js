const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const path = require('path');
const bodyParser = require('body-parser');

const dbPath = 'app/db/database.sqlite3';

const run = async (sql, db) => {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                return reject(err)
            } else {
                return resolve()
            }
        })
    })
};

//リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//publicディレクトリを静的ファイル(HTML等)のルートディレクトリとして設定
app.use(express.static(path.join(__dirname, 'public')));

//get all users
app.get('/api/v1/users', (req, res) => {
    //connect database
    const db = new sqlite3.Database(dbPath);
    db.all(`SELECT * FROM users`, (err, rows) => {
        res.json(rows)
    });
    db.close();
});

//get a user
app.get('/api/v1/users/:id', (req, res) => {
    //connect database
    const db = new sqlite3.Database(dbPath);
    const id = req.params.id;
    db.get(`SELECT * FROM users WHERE id = ${id}`, (err, row) => {
        if (!row) {
            res.status(404).send({error: "Not Found"})
        } else {
        res.status(200).json(row)
        }
    });
    db.close();
});

//search users matching keyword
app.get('/api/v1/search', (req, res) => {
    //connect database
    const db = new sqlite3.Database(dbPath);
    const keyword = req.query.q;
    db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err, rows) => {
        res.json(rows)
    });
    db.close();
});

//create a new user
app.post('/api/v1/users', async (req,res) => {
    if (!req.body.name || req.body.name === "") {
        res.status(400).send({error: "ユーザー名が指定されていません。"})
    } else {
        //connect database
        const db = new sqlite3.Database(dbPath);

        const name = req.body.name;
        const profile = req.body.profile ? req.body.profile : '';
        const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : '';

    try {
        await run(
            `INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
            db
            )
        res.status(201).send({message: "新規ユーザーを作成しました。"})
    } catch(e) {
        res.status(500).send({error: e})
    }

    db.close()
    }
});

//Update user data
app.put('/api/v1/users/:id', async (req,res) => {
    if (!req.body.name || req.body.name === "") {
        res.status(400).send({error: "ユーザー名が指定されていません。"})
    } else {
        //connect database
        const db = new sqlite3.Database(dbPath);
        const id = req.params.id;

        //現在のユーザー情報を取得する
        db.get(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {
            if (!row) {
                res.status(404).send({error: "指定されたデータが見つかりません。"})
            } else {
                const name = req.body.name ? req.body.name : row.name;
                const profile = req.body.profile ? req.body.profile : row.profile;
                const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : row.date_of_birth;
                try {
                    await run(
                        `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id=${id}`,
                        db
                        )
                    res.status(200).send({message: "ユーザー情報を更新しました。"})
                } catch(e) {
                    res.status(500).send({error: e})
                }
            }
        })
        db.close()
    }
});

//delete user data
app.delete('/api/v1/users/:id', async (req,res) => {
    //connect database
    const db = new sqlite3.Database(dbPath);
    const id = req.params.id;

    //現在のユーザー情報を取得する
    db.get(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {

        if (!row) {
            res.status(404).send({error: "指定されたデータが見つかりません。"})
        } else {
            try {
                await run(`DELETE FROM users WHERE id=${id}`, db)
                res.status(200).send({message: "ユーザーを削除しました。"})
            } catch(e) {
                res.status(500).send({error: e})
            }
        }
    })
    db.close()
});

//get all followers
app.get('/api/v1/users/:id/followers', (req, res) => {
    //connect database
    const db = new sqlite3.Database(dbPath)
    const id = req.params.id

    db.all(`SELECT * FROM followers LEFT JOIN users ON followers.followed_id = users.id WHERE following_id = ${id};`, (err, rows) => {
        if (!rows) {
            res.status(404).send({error: "指定されたデータが見つかりません。"})
        } else {
            res.status(200).json(rows)
        }
    });
    db.close();
});

const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listen on port: ' +  port);
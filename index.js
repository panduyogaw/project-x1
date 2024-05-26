const express = require('express');
const app = express();
const { Pool } = require('pg');
const path = require('path');
const ejs = require('ejs');
const PORT = 3000;

require('dotenv').config();

const pool = new Pool({
    user: process.env.USER_NAME,
    host: process.env.HOST_NAME,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        console.log('Error in Connection', err);
        return;
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            console.log('Error Executing Query', err);
        } else {
            console.log('Connected to the database');
        }
    });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/static', express.static('static'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res) => {
    const data = await pool.query(`SELECT * FROM public.todo ORDER BY date`)
    res.render('index', {data: data.rows});
});

app.post('/filter', async (req, res) => {
    const searchDate = req.body.date;
    try {
        const result = await pool.query('SELECT * FROM public.todo WHERE date = $1', [searchDate]);
        res.render('filter', { data: result.rows });
    } catch (error) {
        console.error('Error fetching filtered todos:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/edit/:id', async(req,res)=>{
    const id = req.params.id;
    const data = await pool.query(`SELECT * FROM public.todo WHERE id = $1`, [id]);
    res.render('edit', {data:data.rows})
})

app.post('/update/:id', async(req,res)=>{
    const id = req.params.id;
    const { todo , date } = req.body;

    try{
        await pool.query(`UPDATE todo SET todo = $1, date = $2 WHERE id = $3`, [todo, date, id])
        res.redirect('/')
    }catch(error){
        console.error('Error Updating todo', error);
        res.status(500).json({error : 'Internal Server Error'})
    }
})
// ADD TODO ENDPOINT
app.post('/addTodo', async (req, res) => {
    const { todo, date } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO public.todo (todo, date) VALUES ($1, $2) RETURNING *',
            [todo, date]
        );
        console.log(result.rows[0]);
        res.redirect('/');
    } catch (error) {
        console.log('Error in adding todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/delete/:id', async(req, res)=>{
    const id = req.params.id;
    await pool.query(`DELETE FROM todo WHERE id = $1`, [id])
    res.redirect('/');
})
app.listen(PORT, () => {
    console.log(`Server Getting Started at PORT ${PORT}`);
});

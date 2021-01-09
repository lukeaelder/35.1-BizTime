const express = require('express');
const router = new express.Router();
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({invoices: results.rows});
    } catch(e) {
        return next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, 
                c.code, c.name, c.description
                FROM invoices AS i
                JOIN companies AS c ON c.code = i.comp_code
                WHERE i.id = $1`, [req.params.id]);
        if (results.rows.length === 0){
            throw new ExpressError(`No invoice found with id of ${req.params.id}`, 404)
        }
        const r = results.rows[0]
        return res.json({invoice: {id: r.id, amt: r.amt, paid: r.paid, add_date: r.add_date,
                        paid_date: r.paid_date, company: {code: r.code, name: r.name, description: r.description}}});
    } catch(e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`,
                [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const {amt} = req.body;
        const results = await db.query(
            `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`,
                [amt, req.params.id]);
        if (results.rows.length === 0){
            throw new ExpressError(`No invoice found with id of ${req.params.id}`, 404)
        }
        return res.json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`,[req.params.id]);
        if (results.rows.length === 0){
            throw new ExpressError(`No invoice found with id of ${req.params.id}`, 404)
        }
        return res.json({status: "deleted"});
    } catch(e) {
        return next(e);
    }
});

module.exports = router;
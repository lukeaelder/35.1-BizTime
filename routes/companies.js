const express = require('express');
const router = new express.Router();
const db = require('../db')
const ExpressError = require('../expressError')
const slugify = require('slugify')

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies: results.rows});
    } catch(e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const compResults = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [req.params.code]);
        if (compResults.rows.length === 0){
            throw new ExpressError(`No company found with code of ${req.params.code}`, 404)
        }
        const invResults = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [req.params.code]);
        const results = compResults.rows[0];
        results.invoices = invResults.rows.map(inv => inv.id);
        return res.json({company: results});
    } catch(e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query(
            `INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
                [slugify(code), name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const {name, description} = req.body;
        const results = await db.query(
            `UPDATE companies
                SET name=$1, description=$2
                WHERE code=$3
                RETURNING code, name, description`,
                [name, description, req.params.code]);
        if (results.rows.length === 0){
            throw new ExpressError(`No company found with code of ${req.params.code}`, 404)
        }
        return res.json({company: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`,[req.params.code]);
        if (results.rows.length === 0){
            throw new ExpressError(`No company found with code of ${req.params.code}`, 404)
        }
        return res.json({message: "deleted"});
    } catch(e) {
        return next(e);
    }
});

module.exports = router;
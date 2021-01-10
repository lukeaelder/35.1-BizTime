const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
    await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query("SELECT setval('invoices_id_seq', 1, false)");
  await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                    ('ibm', 'IBM', 'Big blue.')`);
  await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
            VALUES ('apple', 100, false, '2018-01-01', null),
            ('apple', 200, true, '2018-02-01', '2018-02-02'), 
            ('ibm', 300, false, '2018-03-01', null)`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /", function () {
    test("It should return array of invoices", async () => {
        const response = await request(app).get("/invoices");
        expect(response.body).toEqual({
            "invoices": [
                {id: 1, comp_code: "apple"},
                {id: 2, comp_code: "apple"},
                {id: 3, comp_code: "ibm"},
            ]
        });
    });
});

describe("GET /1", function () {
    test("It should return one invoice", async () => {
        const response = await request(app).get("/invoices/1");
        expect(response.body).toEqual({
            "invoice": {
                id: 1,
                amt: 100,
                add_date: expect.any(String),
                paid: false,
                paid_date: null,
                company: {
                  code: 'apple',
                  name: 'Apple',
                  description: 'Maker of OSX.',
                }
            }
        });
    });
    test("It should create an error for not a not found invoice", async function () {
        const response = await request(app).get("/invoice/0");
        expect(response.status).toEqual(404);
    });
});

describe("POST /", function () {
    test("It should add an invoice", async () => {
        const response = await request(app).post("/invoices").send({amt: 999, comp_code:"apple"});
        expect(response.body).toEqual({
            "invoice": {
                id: 4,
                comp_code: "apple",
                amt: 999,
                add_date: expect.any(String),
                paid: false,
                paid_date: null,
            }
        });
    }); 
});

describe("PUT /", function () {
    test("It should update an invoice", async () => {
        const response = await request(app).put("/invoices/1").send({amt: 10000, paid: true});
        expect(response.body).toEqual({
            "invoice": {
                id: 1,
                comp_code: 'apple',
                paid: true,
                amt: 10000,
                add_date: expect.any(String),
                paid_date: expect.any(String),
            }
        });
    }); 
    test("It should create an error for not a not found invoice", async function () {
        const response = await request(app).put("/invoice/0");
        expect(response.status).toEqual(404);
    });
});

describe("DELETE /", function () {
    test("It should delete a company", async () => {
        const response = await request(app).delete("/invoices/1")
        expect(response.body).toEqual({"status": "deleted"});
    }); 
    test("It should create an error for not a not found invoice", async function () {
        const response = await request(app).delete("/invoices/0");        
        expect(response.status).toEqual(404);
    });
});
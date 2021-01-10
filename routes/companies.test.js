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
    test("It should return array of companies", async () => {
        const response = await request(app).get("/companies");
        expect(response.body).toEqual({
            "companies": [
                {code: "apple", name: "Apple"},
                {code: "ibm", name: "IBM"},
            ]
        });
    });
});

describe("GET /ibm", function () {
    test("It should return one company", async () => {
        const response = await request(app).get("/companies/ibm");
        expect(response.body).toEqual({
            "company": {
                code: "ibm",
                name: "IBM",
                description: "Big blue.",
                invoices: [3],
            }
        });
    });
    test("It should create an error for not a not found company", async function () {
        const response = await request(app).get("/companies/not-a-company");
        expect(response.status).toEqual(404);
    });
});

describe("POST /", function () {
    test("It should add a company", async () => {
        const response = await request(app).post("/companies").send({code: "hey", name: "hi", description: "hello"});
        expect(response.body).toEqual({
            "company": {
                code: "hey",
                name: "hi",
                description: "hello",
            }
        });
    }); 
});

describe("PUT /", function () {
    test("It should update an company", async () => {
        const response = await request(app).put("/companies/apple").send({name: "newapple", description: "newdescription"});
        expect(response.body).toEqual({
            "company": {
                code: "apple",
                name: "newapple",
                description: "newdescription",
            }
        });
    }); 
    test("It should create an error for not a not found company", async function () {
        const response = await request(app).put("/companies/notacompany").send({name: "no", description: "no"});
        expect(response.status).toEqual(404);
    });
});

describe("DELETE /", function () {
    test("It should delete a company", async () => {
        const response = await request(app).delete("/companies/apple")
        expect(response.body).toEqual({"message": "deleted"});
    }); 
    test("It should create an error for not a not found company", async function () {
        const response = await request(app).delete("/companies/notacompany");        
        expect(response.status).toEqual(404);
    });
});
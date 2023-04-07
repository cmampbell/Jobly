"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

let testJob;
beforeAll(async () => {
    await commonBeforeAll();
    const result = await Job.findAll();
    testJob = result[0]
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: "0.005",
        companyHandle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({id: expect.any(Number), ...newJob});

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE jobs.title = 'new'`);

        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "new",
                salary: 100000,
                equity: "0.005",
                companyHandle: "c1",
            },
        ]);
    });

    test ("returns NotFound if companyHandle does not exist", async function() {
        try {
            await Job.create( {
                title: "new",
                salary: 100000,
                equity: "0.005",
                companyHandle: "nope",
            })
        } catch (err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});

/************************************** findAll */

describe("findAll", function () {
    test("works", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: 'Job1',
                salary: 1,
                equity: "0.001",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'Job2',
                salary: 2,
                equity: "0.002",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'Job3',
                salary: 3,
                equity: "0.003",
                companyHandle: 'c2'
            }
        ]);
    });
});

/************************************** get */

describe("get", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: "0.005",
        companyHandle: "c1",
    };

    test("works", async function () {
        let testJob = await Job.create(newJob);
        let job = await Job.get(testJob.id);
        expect(job).toEqual({
            id: expect.any(Number),
            title: 'new',
            salary: 100000,
            equity: "0.005",
            companyHandle: "c1",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {

    const updateData = {
        title: "new",
        salary: 100000,
        equity: "0.005"
    };

    test("works", async function () {
        let job = await Job.update(testJob.id, updateData);
        expect(job).toEqual({
            companyHandle: "c1",
            id: expect.any(Number),
            ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [testJob.id]);
        expect(result.rows).toEqual([{
            id: testJob.id,
            companyHandle: testJob.companyHandle,
            ...updateData
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(testJob.id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {

    test("works", async function () {
        await Job.remove(testJob.id);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [testJob.id]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

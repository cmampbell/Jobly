"use strict";

process.env.NODE_ENV = 'test'

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job")

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    a1Token
} = require("./_testCommon");

let testJob;

beforeAll(async () => {
    await commonBeforeAll();
    const jobs = await Job.findAll();
    testJob = jobs[0];
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: "0.005",
        companyHandle: "c1",
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                ...newJob
            }
        });
    });

    test("unauth for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request missing required data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 100000,
                equity: "0.005",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                extraData: "oh no",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'Job1',
                        salary: 1,
                        equity: "0.1",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'Job2',
                        salary: 2,
                        equity: "0.2",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'Job3',
                        salary: 3,
                        equity: null,
                        companyHandle: 'c2'
                    }
                ]
        });
    });

    test("Able to filter jobs by title", async function () {
        const resp = await request(app).get("/jobs").query({ 'title': 'Job1' })

        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'Job1',
                        salary: 1,
                        equity: "0.1",
                        companyHandle: 'c1'
                    }
                ]
        });
    })

    test("Able to filter jobs by minSalary", async function () {
        const resp = await request(app).get("/jobs").query({ 'minSalary': 2 })

        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'Job2',
                        salary: 2,
                        equity: "0.2",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'Job3',
                        salary: 3,
                        equity: null,
                        companyHandle: 'c2'
                    }
                ],
        });
    });

    test("Able to filter jobs by hasEquity", async function () {
        const resp = await request(app).get("/jobs").query({ 'hasEquity': true })

        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'Job1',
                        salary: 1,
                        equity: "0.1",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'Job2',
                        salary: 2,
                        equity: "0.2",
                        companyHandle: 'c1'
                    },
                ],
        });
    })

    test("Multiple filters work together", async function () {
        const resp = await request(app).get("/jobs").query({ 'title': 'Job2', 'minSalary': 2, 'hasEquity': true })

        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'Job2',
                        salary: 2,
                        equity: "0.2",
                        companyHandle: 'c1'
                    }
                ]
        })
    })

    test("No jobs meet critera, return Not Found", async function () {
        const resp = await request(app).get("/jobs").query({ 'title': '4', 'minSalary': 100 })

        expect(resp.body).toEqual({
            "error": {
                "message": "No matching jobs found",
                "status": 404
            }
        })
    })

    test("Invalid filters return an error", async function () {
        const resp = await request(app).get("/jobs").query({ 'title': 'Job2', 'bad': 'filter', 'number': 4 })

        console.log(resp.body)
        expect(resp.body).toEqual({
            "error": {
                "message": [ expect.any(String), expect.any(String)],
                "status": 400
            }
        })
    })

    test("if minSalary can not evaluate to a string, throw Bad Request", async function () {
        const resp = await request(app).get("/jobs").query({ 'minSalary': 'test' })

        expect(resp.body).toEqual({
            "error": {
                "message": [expect.any(String)],
                "status": 400
            }
        })
    })

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
})



/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/${testJob.id}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: 'Job1',
                salary: 1,
                equity: "0.1",
                companyHandle: 'c1'
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: "Job1-new",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: testJob.id,
                title: "Job1-new",
                salary: testJob.salary,
                equity: testJob.equity,
                companyHandle: testJob.companyHandle
            },
        });
    });
    test("unauth for users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: "Job1-new",
            }).set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: "Job1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "nope-new",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on handle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                companyHandle: "c1-new",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                id: 9,
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                badData: "oh no",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJob.id}`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({ deleted: `Job ${testJob.id}` });
    });

    test("unauth for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJob.id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJob.id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});

"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle  }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const companyCheck = await db.query(`
            SELECT handle FROM companies
            WHERE handle = $1
            `, [companyHandle]);

    if (companyCheck.rows.length === 0) throw new NotFoundError(`Company ${companyHandle} not found`);

    const result = await db.query(
      `INSERT INTO "jobs" (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);
    return jobsRes.rows;
  }

  static async findFiltered(data) {

    // map through provided criteria from query string
    // construct an array of individual SQL WHERE conditions
    const filters = Object.keys(data).map((key, idx) => {
      if (key === 'minSalary') {
        return `salary >= $${idx + 1}`
      }
      if (key === 'hasEquity' && data[key]) {
        delete data[key]
        return `equity > 0`
      }
      if (key === 'title') {
        return `title ILIKE '%'||$${idx + 1}||'%'`
      }
    })

    // query with our filters joined, we include all given filters from query as our variables
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE ${filters.join(' AND ')}
      ORDER BY id`, Object.values(data)
    )

    if (jobsRes.rows.length === 0) throw new NotFoundError(`No matching jobs found`);

    return jobsRes.rows
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(jobID) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [jobID]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobID}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(jobID, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});

    const jobIDVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIDVarIdx} 
                      RETURNING id, 
                                title, 
                                salary,
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, jobID]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobID}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(jobID) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [jobID]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobID}`);
  }
}


module.exports = Job;

const { BadRequestError } = require("../expressError");

/** Helper: Translate JavaScript data in to SQL Query.
 *
 * Takes two objects. dataToUpdate contains the values to save in our database. 
 * jsToSQL translates keys from dataToUpdate into their SQL column counterparts.
 * 
 * No data to update returns an error.
 * 
 * We map our jsToSQL values into an array set equal to a SQL variable number.
 * 
 * ex: {firstName: 'first_name', lastName:'last_name' } => ['"first_name" = $1', '"last_name" = $2']
 * 
 * Returns an object with two key-value pairs, setCols is a string we can use in
 * our SQL SET statements, and values contains the values for the columns.
 * 
 * ex return { setCols: '"first_name" = $1', '"last_name" = $2',
 *             values: ['Aliya', 'Morris'] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
          `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

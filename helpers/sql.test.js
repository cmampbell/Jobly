const {sqlForPartialUpdate} = require('./sql');

/****************************sqlForPartialUpdate */

describe('sqlForPartialUpdate unit tests', function() {

    test('Does sqlForPartialUpdate return all input from testData', function() {
        const testData = {
            firstName: 'Matt',
            favColor: 'blue',
            username: 'matt',
            email: 'test@hotmail.com'
        };
    
        const testJSToSQL = {
            'firstName': 'first_name',
            'lastName': 'last_name',
            'favColor': 'fav_color'
        };

        const result = sqlForPartialUpdate(testData, testJSToSQL);

        expect(result.setCols).toEqual('"first_name"=$1, "fav_color"=$2, "username"=$3, "email"=$4')
        expect(result.values).toEqual(Object.values(testData))
    })

    test('Does sqlForPartialUpdate return an error with invalid input', function() {
        expect(() => sqlForPartialUpdate({}, {})).toThrow;
    })

})
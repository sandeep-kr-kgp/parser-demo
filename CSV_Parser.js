'use strict';
const isNum = x => !isNaN(x);

var EOL = {},
    EOF = {},
    QUOTE = 34,
    NEWLINE = 10,
    RETURN = 13;

function CSV_Parser(text, { delimiter = ',', firstColumnAsHeader = false, getJSON = true, getRows = false, getColumns = false, dataTyping = true }) {
    console.time('CSV parsing time: ');
    text.trim();
    var DELIMITER = delimiter.charCodeAt(0),
        columns = {},
        headers = [],
        rows = [],
        jsonArray = [],
        N = text.length,
        I = 0, // current character index
        t, // current token
        eof = N <= 0, // current token followed by EOF?
        eol = false; // current token followed by EOL?
    // Strip trailing newlines, trailing commas and trailing spaces.
    while (text.charCodeAt(N - 1) === 44 || text.charCodeAt(N - 1) === 32 || text.charCodeAt(N - 1) === 10 || text.charCodeAt(N - 1) === 13) {
        N--;
    }

    function token() {
        if (eof) return EOF;
        if (eol) return (eol = false, EOL);

        // Unescape quotes.
        var i, j = I, c;
        if (text.charCodeAt(j) === QUOTE) {
            while ((I++ < N && text.charCodeAt(I) !== QUOTE) || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
        }

        // Find next delimiter or newline.
        while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
        }

        // Return last token before EOF.
        return (eof = true, text.slice(j, N));
    }

    var headersParsed = false;
    while ((t = token()) !== EOF) {
        var row = [];
        var index = 0;
        var json = {};
        while (t !== EOL && t !== EOF) {
            var cellValue = t.trim() || `Missing-Value-at-column-${index}`;
            if (dataTyping) {
                if (isNum(cellValue)) cellValue = parseFloat(cellValue);
            };
            if (getRows) row.push(cellValue);
            if (!headersParsed) {
                headers.push(cellValue);
                if (cellValue in columns) cellValue = cellValue + '-duplicate';
                if (getColumns) columns[cellValue] = [];
            } else {
                if (index >= headers.length) {
                    let header = `Missing-Value-at-column-${index}`;
                    if (getColumns) columns[header] = [];
                    headers.push(header);
                }
                if (getColumns) columns[headers[index]].push(cellValue);
                if (getJSON) json[headers[index]] = cellValue;
            }
            index++;
            t = token();
        }
        if (headersParsed && getJSON) jsonArray.push(json);
        if (getRows) rows.push(row);
        headersParsed = true;
    }

    console.timeEnd('CSV parsing time: ');
    return {
        headers: headers,
        rows: rows,
        columns: columns,
        json: jsonArray
    }
}
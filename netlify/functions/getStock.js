exports.handler = async function(event) {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LYXbaobjbtV6gfz6RJn7k5hHMzdvKWAUUndGj5ou18Q/gviz/tq?tqx=out:json';
  const priceId = event.queryStringParameters.priceId;

  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47, text.length - 2)); // Strip Google padding

    let stock = null;
    const rows = json.table.rows;

    for (let row of rows) {
      const thisPrice = row.c[1]?.v;
      const thisStock = row.c[2]?.v;

      if (thisPrice === priceId) {
        stock = thisStock;
        break;
      }
    }

    if (stock === null) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Price ID not found in sheet' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ stock })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

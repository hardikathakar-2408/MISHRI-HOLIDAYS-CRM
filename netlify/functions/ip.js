const { CORS } = require('./_shared');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ip: 'cloud' }) };
};

const API_ENDPOINT = 'https://sg1ifs0ny1.execute-api.us-east-1.amazonaws.com';

export const connectToDb = async (config) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  };
  console.log({ body: { config } });
  const response = await fetch(`${API_ENDPOINT}/connect`, requestOptions);
  console.log({ response });
  return await response.json();
};
export const openTable = async (config, table, page = 1) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  };
  console.log({ body: { config } });
  const response = await fetch(
    `${API_ENDPOINT}/open/${page}/${table}`,
    requestOptions
  );
  console.log({ response });
  return await response.json();
};

export const describeTable = async (config, table, page = 1) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  };
  console.log({ body: { config } });
  const response = await fetch(`${API_ENDPOINT}/show/${table}`, requestOptions);
  console.log({ response });
  return await response.json();
};

export const execQuery = async (config, query, page = 1) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, query }),
  };
  console.log(JSON.stringify({ config, query }));
  const response = await fetch(`${API_ENDPOINT}/query/${page}`, requestOptions);
  console.log({ response });
  return await response.json();
};

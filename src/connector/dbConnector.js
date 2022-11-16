const API_ENDPOINT = 'https://8a8omau0t8.execute-api.us-east-1.amazonaws.com'; // 'https://sg1ifs0ny1.execute-api.us-east-1.amazonaws.com';

export const connectToDb = async (config) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  }; 
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
  const response = await fetch(`${API_ENDPOINT}/show/${table}`, requestOptions); 
  return await response.json();
};

export const execQuery = async (config, query, page = 1, s = 20) => {
  const size = s === undefined || s === 'undefined' 
    ? 20
    : s;
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, query }),
  }; 
  const response = await fetch(`${API_ENDPOINT}/query/${page}/${size}`, requestOptions); 
  return await response.json();
};

export const execCommand = async (config, query) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, query }),
  }; 
  const response = await fetch(`${API_ENDPOINT}/exec`, requestOptions);
  console.log({ response });
  return await response.json();
};


export const describeConnection = async (config) => {
  const query = ` SELECT
    TABLE_NAME,	TABLE_TYPE,	TABLE_ROWS, AUTO_INCREMENT,	CREATE_TIME, UPDATE_TIME
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE table_schema = '${config.database}' ORDER BY TABLE_NAME `;
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, query }),
  }; 
  const response = await fetch(`${API_ENDPOINT}/query/1`, requestOptions);
  console.log({ response });
  return await response.json();
};


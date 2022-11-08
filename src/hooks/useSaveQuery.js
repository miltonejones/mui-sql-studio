 



const COOKIE = 'mysql-query-list'


export const useSaveQuery = () => { 
  
  const getQueries = () => JSON.parse(localStorage.getItem(COOKIE) ?? '{}');

  const setQueries = (json) => localStorage.setItem(COOKIE, JSON.stringify(json));

  const saveQuery = (query) => {
    const { title, ...config } = query;
    if (!title) return alert('You must enter a Query Name');
    const queries = getQueries();
    Object.assign(queries, { [title]: config  });
    setQueries(queries);
    console.log({ queries }); 
  };

  const deleteQuery = (key) => { 
    const queries = getQueries(); 
    delete queries[key]
    setQueries(queries);
    console.log({ queries }); 
  };


  return { getQueries, saveQuery, deleteQuery }
}
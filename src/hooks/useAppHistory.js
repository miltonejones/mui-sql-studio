import * as React from 'react';


export const useAppHistory = () => {
  const [current, setCurrent] = React.useState(null)
  
  const getAppHistory = () => JSON.parse(localStorage.getItem('mysql-history') ?? '[]');

  const setFavorite = path => { 
    const old = getAppHistory();
    const add = old.map(h => h.path === path ? {...h, favorite: !h.favorite} : h)
    localStorage.setItem('mysql-history', JSON.stringify(add));
  }

  const getFavorite = path => {
    const old = getAppHistory();
    return old.find(f => f.path === path).favorite;
  }

  const getFavorites = path => {
    const old = getAppHistory();
    return old.filter(f => !!f.favorite);
  }

  const setAppHistory = (node) => {
    const old = getAppHistory();
    const ex = old.find (f => f.path === node.path);
    const rep = !ex ? node : {...node, favorite: ex.favorite}
    const add = old.filter(h => h.path !== node.path).concat(rep);
    setCurrent(rep);
    localStorage.setItem('mysql-history', JSON.stringify(add));
  }
 
  return { getAppHistory, setAppHistory, getFavorite, getFavorites, setFavorite, current }
}


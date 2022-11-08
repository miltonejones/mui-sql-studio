import * as React from 'react';

const COOKIE = 'mysql-history-items'

export const useAppHistory = () => {
  const [current, setCurrent] = React.useState(null)
  
  const getAppHistory = () => JSON.parse(localStorage.getItem(COOKIE) ?? '[]');

  const setFavorite = path => { 
    const old = getAppHistory();
    const add = old.map(h => h.path === path ? {...h, favorite: !h.favorite} : h)
    localStorage.setItem(COOKIE, JSON.stringify(add));
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
    const rep = !ex ? node : {...node, favorite: ex.favorite};
    const item = {...rep, when: new Date().toString()}
    const add = old.find(h => h.path === node.path) 
      ? old.map(f => f.path === node.path ? item : f)
      : old.concat(item);
    setCurrent(item);
    localStorage.setItem(COOKIE, JSON.stringify(add));
  }
 
  return { getAppHistory, setAppHistory, getFavorite, getFavorites, setFavorite, current }
}


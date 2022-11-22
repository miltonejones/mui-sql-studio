import * as React from 'react';
import { useLocalStorage } from './useLocalStorage';

const COOKIE = 'mysql-history-items'

export const useAppHistory = () => {
  const [current, setCurrent] = React.useState(null);


  const store = useLocalStorage({
    [COOKIE]: '{}'
  })
  
  
  const getAppHistory = () => JSON.parse(store.getItem(COOKIE));

  const setFavorite = path => { 
    const old = getAppHistory();
    const add = old.map(h => h.path === path ? {...h, favorite: !h.favorite} : h)
    store.setItem(COOKIE, JSON.stringify(add));
  }

  const getFavorite = React.useCallback( path => {
    const old = getAppHistory();
    const source = old.find(f => f.path === path);
    return !!source?.favorite;
  }, [])

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
    store.setItem(COOKIE, JSON.stringify(add));
  }
 
  return { getAppHistory, setAppHistory, getFavorite, getFavorites, setFavorite, current }
}


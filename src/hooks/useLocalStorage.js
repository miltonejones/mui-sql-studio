import * as React from 'react';

export const useLocalStorage = (keys = [], def = {}) => {

  const object = keys.reduce((items, item) => {
    items[item] = localStorage.getItem(item) || def[item];
    return items;
  }, {});

  const [state, setState] = React.useState(object);


  const setItem = (key, value) =>{
    setState(s => ({...s, [key]: value}));
    localStorage.setItem(key, value)
  }


  const getItem = (key) => state[key];



  return { ...state, setItem, getItem }
}
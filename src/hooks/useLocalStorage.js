import * as React from 'react';

export const useLocalStorage = (values = {}) => {
  const object = Object.keys(values).reduce((items, key) => {
    items[key] = localStorage.getItem(key) || values[key];
    return items;
  }, {});

  const [state, setState] = React.useState(object);

  const setItem = (key, value) =>{
    setState(s => ({...s, [key]: value}));
    localStorage.setItem(key, value)
  }

  const getItem = (key) => localStorage.getItem(key); //state[key];

  return { setItem, getItem };
}
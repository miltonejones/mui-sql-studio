import * as React from 'react';



const COOKIE = 'mysql-configs'


export const useConfig = () => {
  const [items, setItems] = React.useState({})
  
  const getConfigs = () => JSON.parse(localStorage.getItem(COOKIE) ?? '{}');

  const setConfigs = (json) => localStorage.setItem(COOKIE, JSON.stringify(json));

  const saveConfig = (input) => {
    const { title, connect, ...config } = input;
    if (!title) return alert('You must enter a Connection Name');
    const configs = getConfigs();
    Object.assign(configs, { [title]: { ...config, connect } });
    setConfigs(configs);
    console.log({ configs });
    setItems(configs)
    // !!connect && openDb(config);
  };


  return { getConfigs, setConfigs, saveConfig, items }
}
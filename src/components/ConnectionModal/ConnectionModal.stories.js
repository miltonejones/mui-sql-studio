import React from 'react';

import ConnectionModal  from './ConnectionModal';
import { useConfig } from '../../hooks/useConfig';
import { connectToDb, execQuery } from '../../connector/dbConnector';
import {  Button } from '@mui/material';


 
export default {
  title: 'Example/ConnectionModal',
  component: ConnectionModal, 
};
 
const Template = (args) => { 
  const { getConfigs, saveConfig } = useConfig()

  const [modalState, setModalState] = React.useState({
    open: false,
    connection: {  }, 
  });

  const configs = getConfigs()
  return <>
  {Object.keys(configs).map(conf => <Button
    onClick={() => {
      setModalState({
        open: true,
        connection: {title: conf, ...configs[conf]},
        onClose: async (c) => { 
          !!c && saveConfig(c)
          setModalState({ open: false })
        }
      })
    }}
  
  key={conf}>{conf}</Button>)}
  <ConnectionModal onChange={(key, val) => {
    setModalState({ ...modalState, connection: {
      ...modalState.connection,
      [key]: val
    }})
  }} {...modalState} />
  </>
};

export const Primary = Template.bind({});

import React from 'react';
import { styled, Box, Checkbox } from '@mui/material';
import { ListGrid } from '../../..';
 
const Layout = styled(Box)(({ theme }) => ({
 margin: theme.spacing(4)
}));
 
const ColumnSettingsGrid = ({ onSelect, columns = [] }) => {
    
  const configRow = (conf, i) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [  
      {
        field: '1',  
        control: Checkbox, 
        controlProps: {
          checked: conf.clicked,
          onClick: () => onSelect(i)
        }
      },   
      {
        field: 'Label', 
        value: conf.alias, 
      },  
      {
        field: 'Name', 
        value: `${conf.objectalias}.${conf.name}`, 
      },  
      {
        field: 'Default',
        value: conf.COLUMN_DEFAULT,
        edit: !0
      }, 
      {
        field: 'Type',
        value: !parts ? conf.COLUMN_TYPE : parts[1],
        types: ['int', 'bit', 'bigint', 'text', 'mediumtext', 'varchar', 'datetime', 'image', 'audio', 'video']
      }, 
      {
        field: 'Size',
        value: !parts ? '' : parts[2],
        edit: !0
      }, 
    ]
  }


  const rows = columns.map(configRow);
 return (
   <Layout data-testid="test-for-ColumnSettingsGrid">
    <ListGrid rows={rows} selectable/>
     {/* {JSON.stringify(columns)} */}
   </Layout>
 );
}
ColumnSettingsGrid.defaultProps = {};
export default ColumnSettingsGrid;

//       {item.objectalias}.{item.name} <i>as {item.alias}</i>
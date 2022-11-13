import React from 'react';
import { styled, Box, Checkbox } from '@mui/material';
import { ListGrid } from '../../..';
 
const Layout = styled(Box)(({ theme }) => ({
 margin: theme.spacing(4)
}));
 
const ColumnSettingsGrid = ({ onSelect, onChange, columns = [] }) => {
    
  const configRow = (conf, i) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE);
    const defaultType = !parts ? conf.COLUMN_TYPE : parts[1];
    return [  
      {
        field: '',  
        control: Checkbox, 
        selected: conf.clicked,
        controlProps: {
          checked: conf.clicked,
          onClick: () => onSelect(i)
        }
      },   
      {
        field: 'Label', 
        selected: conf.clicked,
        value: conf.alias, 
        edit: !0,
      },  
      {
        field: 'Name', 
        selected: conf.clicked,
        value: `${conf.objectalias}.${conf.name}`, 
      },  
      {
        field: 'Default',
        selected: conf.clicked,
        value: conf.COLUMN_DEFAULT,
        edit: !0
      }, 
      {
        field: 'Type',
        selected: conf.clicked,
        value: conf.type || defaultType,
        types: ['int', 'bit', 'bigint', 'text', 'mediumtext', 'varchar', 'datetime', 'image', 'audio', 'video']
      }, 
      {
        field: 'Size',
        selected: conf.clicked,
        value: !parts ? '' : parts[2], 
      }, 
    ]
  }


  const rows = columns.map(configRow);
 return <ListGrid title="Set field order" onCellChange={onChange} rows={rows} selectable/>;
}
ColumnSettingsGrid.defaultProps = {};
export default ColumnSettingsGrid;
 
import React from 'react';
import { Checkbox } from '@mui/material';
import { ListGrid, DATA_TYPES } from '../../..';
import { Settings } from '@mui/icons-material';
  
const ColumnSettingsGrid = ({ onSelect, onChange, onConfig, columns = [] }) => {
    
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
        icon: !!conf.expression ? <Settings /> : null,
        selected: conf.clicked,
        value: !!conf.expression ? conf.name : conf.alias, 
        action: !!conf.expression ? () => onConfig (conf) : null,
        edit: !conf.expression,
      },  
      {
        field: 'Name', 
        selected: conf.clicked,
        value: !!conf.expression ? conf.expression : `${conf.objectalias}.${conf.name}`, 
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
        types: DATA_TYPES
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
 
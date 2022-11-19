import React from 'react';
import { Chip, Link } from '@mui/material';
import { Delete } from '@mui/icons-material';
  
 
const QueryColumn = ({ 
  columnname,
  columnalias,
  small,
  title,
  aliasAction,
  deleteAction,
  icon: Icon = Delete
}) => {
 
  const inner = <>{title} {!small && (<>
   as <Link sx={{cursor: 'pointer'}} onClick={aliasAction}><b>{columnalias || columnname}</b></Link>
  </>)}</>
   
 return ( 
     <Chip label={inner}  
     size="small"
     sx={{color: t => t.palette.primary.dark}}
        onDelete={deleteAction}
        color="primary" variant="outlined" 
              deleteIcon={<Icon />}/> 
 );
}
QueryColumn.defaultProps = {};
export default QueryColumn;

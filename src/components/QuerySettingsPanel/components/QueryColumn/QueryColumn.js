import React from 'react';
import { Chip, Link } from '@mui/material';
import { Delete, Error } from '@mui/icons-material';
  
 
const QueryColumn = ({ 
  columnname,
  columnalias,
  small,
  title,
  error,
  aliasAction,
  deleteAction, 
  icon: Icon = Delete
}) => {
 
  const inner = <>{title} {!small && !!aliasAction && (<>
   as <Link sx={{cursor: 'pointer'}} onClick={aliasAction}><b>{columnalias || columnname}</b></Link>
  </>)}</>
   
 return ( 
     <Chip label={inner}  
     size="small"
     icon={error ? <Error /> : null }
     sx={{color: t => t.palette[error ? 'error' : 'primary'].dark}}
      onClick={aliasAction}
        onDelete={deleteAction}
        color={error ? "error" : "primary"} variant="outlined" 
              deleteIcon={<Icon />}/> 
 );
}
QueryColumn.defaultProps = {};
export default QueryColumn;

import React from 'react';
import { Link, Box, styled } from '@mui/material';
import { Delete, Error } from '@mui/icons-material';
  
 
const QueryColumn = ({ 
  columnname,
  columnalias,
  small,
  title,
  error,
  aliasAction,
  deleteAction, 
  degrees,
  icon: Icon = Delete
}) => {
 
  const inner = <>{title} {!small && !!(columnalias || columnname) && (<>
   as <Link sx={{cursor: 'pointer'}} onClick={aliasAction}><b>{columnalias || columnname}</b></Link>
  </>)}</>
   
 return ( 
    <Coin label={inner}  
     size="small"
     degrees={degrees}
     small={small}
     error={error}
     icon={error ? <Error /> : null }
     sx={{ 
      color: t => t.palette[error ? 'error' : 'primary'].dark, 
    }}
      onClick={aliasAction}
        onDelete={deleteAction}
        color={error ? "error" : "primary"} variant="outlined" 
              deleteIcon={<Icon deg={degrees} />}/> 
 );
}

const Chit = styled('span')(({ theme, small, error }) => ({
  display: 'inline-flex',
  cursor: 'pointer',
  alignItems: 'center',
  width: 'fit-content',
  borderRadius: 4,
  color: error ? theme.palette.error.dark : (small ? '#555' : '#222') ,
  gap: 4,
  border: (small ? 'dotted' : 'solid') + ' 1px ' + theme.palette.primary.dark,
  padding: theme.spacing(0.125, 1),
}))

const Start = styled(Box)(({ theme, error }) => ({
  color: error ? theme.palette.error.dark :  '#222',
  fontSize: '0.85rem',
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline'
  }
}))

const End = styled(Box)(({ theme }) => ({
  borderLeft: 'solid 1px ' + theme.palette.primary.dark ,
  marginLeft: theme.spacing(0.5),
  display: 'inline-flex',
  cursor: 'pointer',
  alignItems: 'center',
  paddingLeft: theme.spacing(1),
  '&:hover': {
    color: theme.palette.error.main,  
  }
}))


const Coin = ({
  icon: Icon,
  error,
  label,
  small,
  deleteIcon,
  onClick, 
  onDelete,
  ...props
}) => {
  return <Chit small={small} error={error}>
    {Icon}
    <Start error={error} onClick={(e) => onClick && onClick(e)}>{label}</Start>
    {!!onDelete && <End onClick={onDelete}>{deleteIcon}</End>}
  </Chit>
}

QueryColumn.defaultProps = {};
export default QueryColumn;

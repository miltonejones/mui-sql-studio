import React from 'react'; 
import { ListGrid } from '../../';
import { useNavigate, useParams } from "react-router-dom";
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { useConfig } from '../../../hooks/useConfig';
import { Launch, Add, Close, Key } from '@mui/icons-material';
import { execQuery } from '../../../connector/dbConnector';
 

function TableGrid () {
  const [loaded, setLoaded] = React.useState(false) ;
  const navigate = useNavigate();
  const [data, setData] = React.useState(null)
  const { schema,  tablename, connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)

  const { Alert, Confirm, setAppHistory, setBreadcrumbs } = React.useContext(AppStateContext);
  

  
  const configRow = (conf) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [ 
      {
        field: 'Name', 
        value: conf.COLUMN_NAME,
        icon: !!conf.CONSTRAINT_NAME ? <Key color={ conf.CONSTRAINT_NAME === 'PRIMARY' ? "primary" : "warning"} /> : '',
        edit: !0
      }, 
      {
        field: 'Position',
        value: conf.ORDINAL_POSITION
      },
      {
        field: 'Default',
        value: conf.COLUMN_DEFAULT,
        edit: !0
      },
      {
        field: 'Nullable',
        value: conf.IS_NULLABLE, 
        types: ['YES', 'NO']
      },
      {
        field: 'Type',
        value: !parts ? conf.COLUMN_TYPE : parts[1],
        types: ['int', 'bit', 'bigint', 'text', 'mediumtext', 'varchar', 'datetime']
      }, 
      {
        field: 'Size',
        value: !parts ? '' : parts[2],
        edit: !0
      }, 
    ]
  }

  const commitRow = async ({ data: new_def, row: old_def}) => {  
    const locate = (row, key) => row.find(f => f.field === key).value;
    const command = [`ALTER TABLE ${tablename}`];
    command.push (
      locate(old_def, "Name") === locate(new_def, "Name") 
        ? `MODIFY COLUMN ${locate(old_def, "Name")}`
        : `CHANGE COLUMN ${locate(old_def, "Name")} ${locate(new_def, "Name")}`,
      locate(new_def, "Type")
    );
    !!locate(new_def, "Size") && !!locate(new_def, "Size").trim() && 
      command.push(`(${locate(new_def, "Size")})`);
    command.push(locate(new_def, "Nullable") === 'YES' ? "NULL" : "NOT NULL");
    !!locate(new_def, "Default") && command.push (`DEFAULT "${locate(new_def, "Default")}"`);
    const sql = command.join(' ');
    const ok = await Confirm(sql);
    if (!ok) return;
    await execQuery(configs[configKey], sql);
    await loadTable();
  }
  
  const loadTable = React.useCallback(async() => {
    const f = await execQuery(configs[configKey], `SELECT
    u.CONSTRAINT_NAME, u.REFERENCED_TABLE_NAME, u.REFERENCED_COLUMN_NAME, 
    t.COLUMN_NAME,	t.ORDINAL_POSITION,	t.COLUMN_DEFAULT,	t.IS_NULLABLE,t.COLUMN_TYPE	 ,
    t.DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS t LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE u 
    ON u.TABLE_NAME = t.TABLE_NAME and u.COLUMN_NAME = t.COLUMN_NAME
    WHERE t.TABLE_NAME = '${tablename}' 
    GROUP BY t.ORDINAL_POSITION ORDER BY t.ORDINAL_POSITION `)
    setData(f);
  }, [configs, configKey, tablename]);

  React.useEffect(() => {
    if (!!data) return;
    loadTable();
  }, [ data, loadTable ])
 

  const breadcrumbs = [
    {
      text: 'Home',
      href: '/'
    },
    {
      text: configKey,
      href: '/connection/' + connectionID
    },
    {
      text: tablename
    }
  ] 

  const saveMenu =  [
    {
      title: 'Open Table',
      icon: Launch,
      action:  () => {
        navigate(`/query/${connectionID}/${schema}/${tablename}`)
      }
    },  
    {
      title: "Add Column",
      icon: Add,
      action: () => Alert('Add column not implemented')
    },
    {
      title: 'Return to Connection',
      icon: Close,
      action:  () => {
        navigate(`/connection/${connectionID}`)
      }
    }, ] 
     
 
  React.useEffect(() => {
    if(loaded) return
    setAppHistory({
      title: `${configKey} | ${tablename} | Columns`,
      path: `/table/${connectionID}/${schema}/${tablename}`,
      connectionID,
      schema,
      tablename
    });

    setBreadcrumbs(breadcrumbs);
    setLoaded(true)
  }, [configKey, loaded, breadcrumbs, connectionID, schema, tablename, setAppHistory])
 
  return <> 
  <ListGrid menuItems={saveMenu} breadcrumbs={breadcrumbs} commitRow={commitRow} title={`Columns in "${tablename}"`} 
      rows={data?.rows?.map(configRow)} />  
  </>

}
 

TableGrid.defaultProps = {};
export default TableGrid;

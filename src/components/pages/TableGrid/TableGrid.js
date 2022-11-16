import React from 'react'; 
import { ListGrid, TinyButton, Flex, Tooltag } from '../../';
import { Stack, Box, Typography, Link , Divider} from '@mui/material';
import { useNavigate, useParams } from "react-router-dom";
import { AppStateContext } from '../../../hooks/AppStateContext';
import { formatConnectName } from '../../../util';
import { useConfig } from '../../../hooks/useConfig';
import { Launch, Add, Remove, Close, Key, Delete } from '@mui/icons-material';
import { execQuery, execCommand } from '../../../connector/dbConnector';
 

function TableGrid () {
  const [loaded, setLoaded] = React.useState(false) ;
  const navigate = useNavigate();
  const [data, setData] = React.useState(null)
  const [create, setCreate] = React.useState(false)
  const { schema,  tablename, connectionID } = useParams();
  const { getConfigs  } = useConfig()
  const configs = getConfigs();
  const configKey = Object.keys(configs).find(f => formatConnectName(f) === connectionID)

  const { Alert, Confirm, Prompt, setAppHistory, setBreadcrumbs } = React.useContext(AppStateContext);
  

  
  const configRow = (conf) => {
    const regex = /(\w+)\((\d+)\)/;
    const parts = regex.exec(conf.COLUMN_TYPE)
    return [ 
      {
        field: 'Name', 
        value: conf.COLUMN_NAME,
        icon: !!conf.CONSTRAINT_NAME ? <Key color={ conf.CONSTRAINT_NAME === 'PRIMARY' ? "primary" : "warning"} /> : '',
        edit: !0,
        popover: conf.CONSTRAINT_NAME && conf.CONSTRAINT_NAME !== 'PRIMARY' 
          ? <Stack>
          <Typography sx={{ p: t => t.spacing(2,2,0,2) }} variant="caption">Constraint <b>{conf.CONSTRAINT_NAME}</b></Typography>
          <Typography sx={{ p: t => t.spacing(0,2,0,2) }}
            ><Tooltag component={Link} title="Open reference table" href={`/table/${connectionID}/${schema}/${conf.REFERENCED_TABLE_NAME}`}>{conf.REFERENCED_TABLE_NAME}</Tooltag>.{conf.REFERENCED_COLUMN_NAME}</Typography>
          <Divider sx={{mb: 1}}/>
          <Flex sx={{ p: t => t.spacing(0,0,2,0) }}
            ><Box sx={{flexGrow: 1}} />
            <Typography variant="caption"><Link>Drop Constraint</Link></Typography>
            <TinyButton icon={Delete} /> </Flex>
          </Stack>
          : null,
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

  const locate = (row, key) => row.find(f => f.field === key).value;

  const dropRow = async (data) => {
    const command = [`ALTER TABLE ${tablename}`]; 
    const name = locate(data, 'Name');
    command.push(`DROP COLUMN ${name}`)
    const sql = command.join(' ');
    const ok = await Prompt(<>
        <Typography variant="caption">{sql}</Typography>
        <Box>
        Delete column "{name}"? This action cannot be undone! To confirm this action type <i>delete</i> in the box below.
        </Box>
      </>, 'Confirm column delete', null, null, 'Type "delete"');
    if (ok === 'delete') {
      const res = await execCommand(configs[configKey], sql);
      if (res.error) {
        return Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
      }
      return await loadTable();
    }
    Alert ('operation cancelled')
  }

  const commitRow = async ({ data: new_def, row: old_def, create}) => {  
    const command = [`ALTER TABLE ${tablename}`];

    // if (create) {
   console.log ({ new_def, old_def })
    // }

    command.push (
      locate(old_def, "Name") === locate(new_def, "Name") || create
        ? `${create ? 'ADD' : 'MODIFY'} COLUMN ${locate(create ? new_def : old_def, "Name")}`
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
    const res = await execCommand(configs[configKey], sql);
    if (res.error) {
      return Alert('Could not complete request. Error: "' + res.error.sqlMessage + '"', 'SQL ERROR')
    }
    setCreate(false)
    await loadTable();
  }
  
  const loadTable = React.useCallback(async() => {
    setData(null)
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
      icon: create ? Remove : Add,
      deg: create ? 0 : 180,
      action: () => setCreate(!create), // Alert('Add column not implemented')
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
  <ListGrid create={create} 
      onDelete={dropRow}
      allowDelete
      menuItems={saveMenu} breadcrumbs={breadcrumbs} commitRow={commitRow} title={`Columns in "${tablename}"`} 
      rows={data?.rows?.map(configRow)} />  
{/* {JSON.stringify(data)} */}
  </>
}
 

TableGrid.defaultProps = {};
export default TableGrid;

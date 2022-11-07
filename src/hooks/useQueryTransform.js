import * as React from 'react';

export const useQueryTransform = () => {

  const predicates = React.useMemo(() => [
    {
      name: 'EQUALS', 
      transform: (s) => `= '${s}'`
    },
    {
      name: 'DOES NOT EQUAL' , 
      transform: (s) => `<> '${s}'`
    },
    {
      name: 'IS GREATER THAN' , 
      transform: (s) => `> ${s}`
    },
    {
      name: 'IS LESS THAN' , 
      transform: (s) => `< ${s}`
    },
    {
      name: 'CONTAINS' , 
      transform: (s) => `LIKE '%${s}%'`
    },
    {
      name: 'STARTS WITH' , 
      transform: (s) => `LIKE '${s}%'`
    },
    {
      name: 'ENDS WITH' , 
      transform: (s) => `LIKE '%${s}'`
    },
    {
      name: 'IS NULL' , 
      transform: (s) => `IS NULL`
    },
    {
      name: 'IS NOT NULL' , 
      transform: (s) => `IS NOT NULL`
    },
  ], [])

  const findTable = React.useCallback((tables, name) => tables.find((n) => n.name === name), []);
  const findAlias = React.useCallback((tables, name) => !findTable(tables, name) ? name : findTable(tables, name).alias, [findTable]);

  const decodeClause = React.useCallback((key, value) => {
    const clause = predicates.find(f => f.name === key)
    if (clause) {
      return clause.transform(value)
    }
    return value;
  }, [predicates])


  const createTSQL = React.useCallback((configuration) => {
    const { tables, wheres, orders } = configuration;
    const sql = ['SELECT'];
    const cols = [];
    const from = [];
    const where = [];
    const order = [];

    tables.map((table, i) => {
      const { destTable, srcCol, destCol } = table.join ?? {};
      table.columns
        .filter((f) => !!f.selected)
        .map((col) => cols.push(`${table.alias}.${col.name} as ${col.alias}\n`));
      from.push(
        i === 0
          ? ` ${table.name} as ${table.alias}\n`
          : `\n JOIN ${table.name} as ${table.alias} ON \n  ${table.alias}.${srcCol} = ${findAlias(configuration.tables, destTable)}.${destCol}\n`
      );
    });

    wheres.map((clause, i) => {
      where.push (`${clause.operator || ''} ${clause.fieldName} ${decodeClause(clause.predicate, clause.clauseProp)}\n`)
    })

    orders.map((by, i) => {
      order.push (` ${by.fieldName} ${by.direction}\n`)
    })

    const core = [...sql, '\n', cols.length ? cols.join(', ') : '*', '\n', 'FROM', '\n', ...from];
    wheres.length && core.push('\n', '\n WHERE\n', ...where);
    orders.length && core.push('\n ORDER BY\n', order.join(', '));

    const o = core.join(' ');
    return o;
  }, [findAlias, decodeClause]);


  return { decodeClause, predicates, createTSQL, findAlias, findTable }
  
}


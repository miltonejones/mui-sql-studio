

export const formatConnectName = name => name.toLowerCase().replace(/\s/g, '_');
  
export const EMPTY_CONFIGURATION = {
  tables: [],
  wheres: [],
  orders: [],
  groups: [],
  fields: []
};

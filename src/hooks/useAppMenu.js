// import * as React from 'react'; 
// import { AppStateContext } from './AppStateContext';
import { useConfig } from './useConfig';
import { useSaveQuery } from './useSaveQuery';
import { useAppHistory } from './useAppHistory';
import { formatConnectName } from '../util';
import moment from 'moment';


export const useAppMenu = () => {
  

  const {
    getAppHistory, 
    getFavorites, 
    current,   
  } = useAppHistory();  

  const { getConfigs  } = useConfig()
  const { getQueries } = useSaveQuery();
  const configs = getConfigs();

  const gotHistory = getAppHistory();
  const appFavorites = getFavorites();
  const appQueries = getQueries();
 
  const historyNodes = gotHistory.length < 10 ? gotHistory 
    : gotHistory.slice( gotHistory.length - 10);

  const queryNode = Object.keys(appQueries).length ? [{
    title: 'Lists',
    descendants:  Object.keys(appQueries).map(title => {
      const { schema, tablename, connectionID } = appQueries[title];
      return {
        title,
        active: current?.title?.indexOf(title) > -1,
        path: `/lists/${connectionID}/${schema}/${tablename}/${formatConnectName(title)}`
      }
    })
  }] : []

  const humanize = time => { 
    var duration = moment.duration(new Date().getTime() - new Date(time).getTime());
    return duration.humanize() + ' ago'
  }


  const buttons = [
    { 
      label: 'All',
      options: queryNode.concat([

        {
          title: 'Connections',
          descendants: Object.keys(configs).map(title => ({
            title,
            active: current?.title?.indexOf(title) > -1,
            path: `/connection/${formatConnectName(title)}`
          }))
        },   
        {
          title: 'Query Analyzer',
          path: '/sql'
        }, 
        {
          title: 'Local Storage Data',
          path: '/json'
        }
        
      ])
    },
    { 
      label: 'Favorites',
      options: appFavorites.length ? appFavorites.map(p => ({
        title: p.title,
        active: p.path === current?.path,
        path: p.path, 
      })) : [
        {
          title: 'No favorites yet', 
        }, 
      ]
    },
    { 
      label: 'History',
      options: historyNodes.filter(f => !!f.when).length ? historyNodes.filter(f => !!f.when).map(p => ({
        title: p.title,
        active: p.path === current?.path,
        subtext: humanize(p.when),
        path: p.path, 
      })) : [
        {
          title: 'No history yet', 
        }, 
      ]
    }
  ] 
 

  return { buttons }
}
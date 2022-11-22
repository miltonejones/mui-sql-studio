import * as React from 'react';
import { useNavigate } from "react-router-dom"; 

export const AppStateContext = React.createContext({});

export const useNavigation = () => {
  const navigateTo = useNavigate();
  const { setQueryState } = React.useContext(AppStateContext);
  const navigate = (href) => {
    setQueryState((s) => ({ ...s, data: null, loaded: false }));
    navigateTo(href);
  };
  return { navigate }
}

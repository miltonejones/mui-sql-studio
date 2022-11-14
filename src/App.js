
import * as React from 'react';
import { BrowserRouter, Routes, Route, } from "react-router-dom";
import Modal, { useModal } from './components/Modal/Modal';
import { ToggleToolbar, Area, ConnectionModal } from './components'
import { Box, Stack, Typography, styled } from '@mui/material'; 
import { useAppHistory } from './hooks/useAppHistory';
import { AppStateContext } from './hooks/AppStateContext';  
import { Helmet } from "react-helmet";
import { SaveAs } from '@mui/icons-material';
import { 
  JsonTabs, 
  HomePage, 
  ConnectionGrid, 
  TableGrid, 
  QueryGrid, 
  QueryAnalyzer 
} from './components/pages';
import './App.css';
import './components/ListGrid/ListGrid.css';
  

const Footer = styled(Stack)(() => ({
  alignItems: 'center', 
  width: 'calc(100vw - 24px)', 
  padding: 0, 
  position: "absolute", 
  bottom: 0, 
  color: 'white'
}));
 
 
  
function App() { 

  const [audioProp, setAudioProp] = React.useState(null) ;
  const [modalState, setModalState] = React.useState({
    open: false,
    connection: {  }, 
  });

  const {
    Alert,
    Confirm,
    Prompt, 
    ExpressionModal,
    modalProps,
  } = useModal()

  const props = useAppHistory(); 
  const { current } = props;

  const [pinnedTab, setPinnedTab] = React.useState(localStorage.getItem('pinned-tab')); 

  const pinTab = tab => { 
    setPinnedTab(tab);
    localStorage.setItem('pinned-tab', tab)
  }
 
  return (
    <AppStateContext.Provider value={{ 
        ...props, 
        audioProp,
        setAudioProp,
        Alert,
        Confirm,
        Prompt,
        ExpressionModal,
        setModalState 
      }}>
      <div className="App">

        {/* document title  */}
        {current?.title && <Helmet> 
            <title>MySQLNow | {current.title}</title> 
        </Helmet>}

        {/* main application workspace */}
        <BrowserRouter>

          {/* toolbar  */}
          <ToggleToolbar 
            setModalState={setModalState} 
            {...props} 
            pinnedTab={pinnedTab}
            setPinnedTab={pinTab}
          />

          {/* work surface  */}
          <Area pinned={!!pinnedTab}> 
            <Routes>
              <Route path="/" element={<HomePage pinned={!!pinnedTab} />} /> 
              <Route path="/connection/:connectionID" element={<ConnectionGrid  />} /> 
              <Route path="/table/:connectionID/:schema/:tablename" element={<TableGrid  />} /> 
              <Route path="/query/:connectionID/:schema/:tablename" element={<QueryGrid  />} /> 
              <Route path="/lists/:connectionID/:schema/:tablename/:listname" element={<QueryGrid   />} /> 
              <Route path="/sql/:connectionID/:schema/:tablename/:listname" element={<QueryAnalyzer   />} /> 
              <Route path="/sql" element={<QueryAnalyzer   />} /> 
              <Route path="/json" element={<JsonTabs   />} /> 
            </Routes>
          </Area>
        </BrowserRouter>


        {/* page footer  */}
        <Footer spacing={1} direction="row">
          {!!audioProp && <Typography sx={{ ml: 1 }} variant="caption">Now playing: <b>{audioProp}</b></Typography>}
          <Box sx={{flexGrow: 1}}/>
          <SaveAs />
          <Typography variant="caption">MySQL<b>Now</b>.</Typography>
          <Typography variant="caption"><a style={{color: 'orange'}} rel="noreferrer" href="https://github.com/miltonejones/mui-sql-studio" target="_blank">Check out the repo</a>.</Typography>
        </Footer>

        {/* general global modal  */}
        <Modal {...modalProps} />

        {/* connection settings dialog  */}
        <ConnectionModal onChange={(key, val) => {
          setModalState({ ...modalState, connection: {
            ...modalState.connection,
            [key]: val
          }})
        }} {...modalState} />
        
        {/* hidden audio player */}
        {!!audioProp && <audio controls autoPlay style={{display: 'none'}}> 
          <source src={audioProp} type="audio/mpeg"/>
        Your browser does not support the audio element.
        </audio>}

      </div>
    </AppStateContext.Provider>
  );
}

export default App;

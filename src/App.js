
import * as React from 'react';
import { BrowserRouter, Routes, Route, } from "react-router-dom";
import Modal, { useModal } from './components/Modal/Modal';
import { ToggleToolbar, Area, ConnectionModal } from './components'
import { Box, Stack, Typography, Link, Breadcrumbs, styled } from '@mui/material'; 
import { useAppHistory } from './hooks/useAppHistory';
import { AppStateContext } from './hooks/AppStateContext';  
import { Helmet } from "react-helmet";
import { SaveAs, StopCircle } from '@mui/icons-material';
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
  
  const [breadcrumbs, setBreadcrumbs] = React.useState(null) ;
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

  const appHistory = useAppHistory(); 
  const { current } = appHistory;

  const [pinnedTab, setPinnedTab] = React.useState(localStorage.getItem('pinned-tab')); 
  const [pageSize, commitPageSize] = React.useState(localStorage.getItem('page-size') || 100); 

  const pinTab = tab => { 
    setPinnedTab(tab);
    localStorage.setItem('pinned-tab', tab)
  }

  const setPageSize = (size) => {
    commitPageSize(size);
    localStorage.setItem('page-size', size)
  }
 
  return (
    <AppStateContext.Provider value={{ 
        ...appHistory, 
        setPageSize,
        pageSize,
        audioProp,
        setAudioProp,
        setBreadcrumbs,
        Alert,
        Confirm,
        Prompt,
        ExpressionModal,
        setModalState 
      }}>
      <Box className="App" sx={{backgroundColor: theme => theme.palette.primary.main}}>

        {/* document title  */}
        {current?.title && <Helmet> 
            <title>MySQLNow | {current.title}</title> 
        </Helmet>}

        {/* main application workspace */}
        <BrowserRouter>

          {/* toolbar  */}
          <ToggleToolbar 
            setModalState={setModalState} 
            {...appHistory} 
            pinnedTab={pinnedTab}
            setPinnedTab={pinTab}
          />
         <Box sx={{position: 'absolute', top: 60, left: pinnedTab ? 356 : 16 }}>
         {!!breadcrumbs && <>
            <Breadcrumbs separator={<b style={{color: 'white'}}>›</b>} aria-label="breadcrumb">
              {breadcrumbs.map(crumb => crumb.href 
                ? <Link sx={{color: 'white' }} href={crumb.href}><Typography variant="body2">{crumb.text}</Typography></Link> 
                : <Typography sx={{color: 'white', fontWeight: 600 }} variant="body2">{crumb.text}</Typography>)}
            </Breadcrumbs>
          </>}
         </Box>
          {/* work surface  */}
          <Area pinned={!!pinnedTab} breadcrumbs={breadcrumbs}>  
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
          {!!audioProp && <><StopCircle onClick={() => setAudioProp(null)} sx={{ml: 2, cursor: 'pointer'}}/> <Typography sx={{ ml: 1 }} variant="caption">Now playing: <b>{audioProp}</b></Typography></>}
          <Box sx={{flexGrow: 1}}/>
          <SaveAs />
          <Typography variant="caption">MySQL<b>Now</b>. The "Low-Code" SQL solution.</Typography>
          {/* <Typography variant="caption"><a style={{color: 'orange'}} rel="noreferrer" href="https://github.com/miltonejones/mui-sql-studio" target="_blank">Check out the repo</a>.</Typography> */}
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

      </Box>
    </AppStateContext.Provider>
  );
}

export default App;

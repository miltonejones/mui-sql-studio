
import * as React from 'react';
import { BrowserRouter, Routes, Route, } from "react-router-dom";
import Modal, { useModal } from './components/Modal/Modal';
import { QuickSelect, ToggleToolbar, Area, ConnectionModal, RotateButton, Flex, Spacer } from './components'
import { Box, Stack, FormControlLabel, Popover, Switch, Typography, Link, 
  Dialog, Menu, Drawer, Breadcrumbs, styled } from '@mui/material'; 
import { useAppHistory } from './hooks/useAppHistory';
import { AppStateContext } from './hooks/AppStateContext';  
import { Helmet } from "react-helmet";
import { SaveAs, StopCircle, Settings } from '@mui/icons-material';
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
import { useLocalStorage } from './hooks/useLocalStorage';
  

const Footer = styled(Stack)(() => ({
  alignItems: 'center', 
  width: 'calc(100vw - 24px)', 
  padding: 0, 
  position: "absolute", 
  bottom: 0, 
  color: 'white'
})); 
 
 
  
function App() { 
  
  const [queryState, setQueryState] = React.useState({
    loaded: false,
    data: null
  })
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
  const [anchorEl, setAnchorEl] = React.useState(null);
 

  const store = useLocalStorage({
    'menu-pos': 'bottom',
    'page-size': 100,
    'use-menus': '1',
    'use-modals': null,
    'pinned-tab': null,
  })

  const menuPos = store.getItem('menu-pos');
  const useMenus = store.getItem('use-menus');
  const useModals = store.getItem('use-modals');
  const pinnedTab = store.getItem('pinned-tab');
  const pageSize = store.getItem('page-size');

  
  const open = Boolean(anchorEl);

  const handlePopoverClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null); 
  };

  const commitMenuPos = (pos) =>{ 
    store.setItem('menu-pos', pos)
  }

  const handleChange = (key) => async (event) => {
    const checked = event.target.checked ? '1' : '0'; 
    store.setItem(key, checked)
  };

  const pinTab = tab => {  
    store.setItem('pinned-tab', tab)
  }

  const setPageSize = (size) => { 
    store.setItem('page-size', size)
  }

  const MenuComponent = useMenus === '1' ? Menu : Drawer;
  const PopComponent = useMenus === '1' ? Popover : Drawer;
  const ModalComponent = useModals === '1' ? Dialog : Drawer;
  const width = !pinnedTab ? 'calc(100vw - 24px)' : 'calc(100vw - 364px)'
 
  return (
    <AppStateContext.Provider value={{ 
        ...appHistory, 
        setPageSize,
        pageSize,
        audioProp,
        setAudioProp,
        PopComponent,
        menuPos,
        setBreadcrumbs,
        queryState, 
        setQueryState,
        Alert,
        Confirm,
        Prompt,
        ExpressionModal,
        MenuComponent,
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

          <Box sx={{ position: 'absolute', top: 48, left: pinnedTab ? 356 : 16 }}>
            {!!breadcrumbs && <Flex sx={{ width }}>
              <Breadcrumbs separator={<b style={{ color: 'white' }}>›</b>} aria-label="breadcrumb">
                {breadcrumbs.map((crumb, o) => crumb.href 
                  ? <Link key={o} sx={{ color: 'white' }} href={crumb.href}><Typography variant="body2">{crumb.text}</Typography></Link> 
                  : <Typography key={o} sx={{ color: 'white', fontWeight: 600 }} variant="body2">{crumb.text}</Typography>)}
              </Breadcrumbs>
              <Spacer />
              <Box>
                <RotateButton deg={ open ? 0 : 360 } onClick={handlePopoverClick}>
                  <Settings sx={{ color: 'white' }} />
                </RotateButton>
                <PopComponent
                    open={open}
                    anchor={menuPos}
                    anchorEl={anchorEl}
                    onClose={handlePopoverClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }} >
                    <Stack spacing={1.5} sx={{p: 2, height: useMenus !== '1' || useModals !== '1' 
                      ? 280 : 'inherit'}}>

                    <Box>
                      <FormControlLabel
                        label="Use dialogs"
                        control={ <Switch  
                          checked={useModals  === '1'}
                          onChange={handleChange('use-modals')} 
                        />}
                      />
                    </Box>
                    
                    <Box>
                      <FormControlLabel
                        label="Use menus"
                        control={ <Switch  
                          checked={useMenus === '1'}
                          onChange={handleChange('use-menus')} 
                        />}
                      />
                    </Box>


                    <QuickSelect sx={{mt: 1}} options={['top','bottom','left','right']} 
                        label="Menu Position" value={menuPos} 
                        disabled={useMenus === '1' && useModals === '1'}
                        onChange={commitMenuPos}/>
                    </Stack>
                </PopComponent>
              </Box>
            </Flex>}
          </Box>

          {/* work surface  */}
          <Area pinned={!!pinnedTab ? 1 : 0} breadcrumbs={breadcrumbs}>   
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
        <Modal {...modalProps} tag={ModalComponent} anchor={menuPos}  />

        {/* connection settings dialog  */}
        <ConnectionModal onChange={(key, val) => {
          setModalState({ ...modalState, connection: {
            ...modalState.connection,
            [key]: val
          }})
        }} {...modalState} 
        component={ModalComponent}/>
        
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


import { Box, Stack } from '@mui/material'; 
import { useNavigation } from '../../../../hooks/AppStateContext';
  
 
export const LogoURL = 'https://associate-ui.s3.amazonaws.com/kisspng-mysql-relational-database-management-system-logo-m-mysql-instalaci%C3%B3n-y-creaci%C3%B3n-usuario-atrum-5b649e7bb60bf3.4045674715333208277457.png';

const Logo = ({ short }) =>{ 
  const { navigate } = useNavigation(); 
  return <Stack onClick={() => navigate('/')} sx={{
        cursor: 'pointer', ml: 2, mr: 4, width: short ? 144 : 300 , alignItems: 'center'}} 
        spacing={1} direction="row" >
    <img alt="logo" src={LogoURL} style={{height:  32, width: 'auto'}}/>
    <Box sx={{fontFamily: 'Play'}}>MySQL<b style={{color: 'orange'}}>Now</b></Box>
  </Stack>
}

Logo.defaultProps = {};
export default Logo;

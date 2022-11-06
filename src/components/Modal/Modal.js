import React from "react";
import {
 Dialog,
 IconButton,
 Stack,
 TextField,
 Typography,
 Box,
} from "@mui/material";
import { Flex, Tooltag, Spacer, TextBtn } from "..";
import { Business, Close } from "@mui/icons-material";
 
// global style for Modal TextFields
// TODO: this should be in a styled component
const modalTextProps = {
 size: "small",
 fullWidth: true,
 autoFocus: true,
 sx: { mt: 2 },
};
 
/**
* Creates a global Modal wrapper component
*/
const Modal = ({
 // TRUE when Modal is open
 open,
 
 // title to display in Modal header
 title,
 
 // component to display in the Modal
 component:
   // when no component is passed, use a barebones
   // text fragment (eg., Alert and Prompt modals)
   Component = ({ message: m }) => <>{m}</>,
 
 // tag wrapper for the Modal (Dialog|Drawer)
 tag: Tag = Dialog,
 
 // sets whether Save button is enabled by default
 enableSave,
 
 // * Modal output
 // * NOTE: output methods are handled in the useModal hook
 // ------------------------------------------------------------------- *
 // method called with Okay button is clicked
 submitClicked,
 
 // method called when Cancel button is clicked
 closeClicked,
 
 header: HeaderComponent = ModalHeader,
 
 footer: FooterComponent = ModalFooter,
 
 maxWidth = 420,
 minWidth = 360,
 
 // * Modal input
 // * NOTE: input properties pass through to the injected component
 // ------------------------------------------------------------------- *
 ...props
}) => {
 const [modalState, setModelState] = React.useState(null);
 
 // clear modalState when the modal closes
 const handleClose = () => {
   setModelState(null);
   closeClicked();
 };
 
 const footerProps = {
   handleClose,
   enableSave,
   modalState,
   submitClicked,
 };
 return (
   <Tag anchor="right" onClose={handleClose} open={open}>
     <Stack sx={{ maxWidth, minWidth, height: "100%" }}>
       {/* modal header */}
 
       <HeaderComponent {...props} handleClose={handleClose} />
 
       {/* modal injected component */}
       {!!Component && (
         <Box  sx={{p: theme => theme.spacing(0, 2, 2, 2)}}>
           <Component {...props} onChange={setModelState} />
         </Box>
       )}
       <Box sx={{ flexGrow: 1 }} />
       {/* modal footer */}
       <Box>
         <FooterComponent {...props} {...footerProps} />
       </Box>
     </Stack>
   </Tag>
 );
};
 
const ModalFooter = ({
 handleClose,
 enableSave,
 modalState,
 submitClicked,
 title,
}) => (
 <Flex sx={{ p: 2, borderTop: "solid 1px #cdcdcd" }}>
   <Spacer />
 
   {/* Close button */}
   <Tooltag
     component={TextBtn}
     title="Close dialog"
     variant="outlined"
     onClick={handleClose}
   >
     close
   </Tooltag>
 
   {/* only show Okay button when submitClicked is defined */}
   {/* Okay button */}
   {!!submitClicked && (
     <Tooltag
       component={TextBtn}
       disabled={!enableSave && !modalState}
       title={title}
       variant="contained"
       onClick={() => submitClicked && submitClicked(enableSave || modalState)}
     >
       Okay
     </Tooltag>
   )}
 </Flex>
);
 
const ModalHeader = ({ handleClose, title }) => (
 <Flex sx={{ pl: 1, pr: 1, mb: 1, borderBottom: "solid 1px #cdcdcd" }}>
   <IconButton>
     <Business />
   </IconButton>
   <Typography variant="subtitle2">{title}</Typography>
   <Spacer />
   <Tooltag component={IconButton} title="Close dialog" onClick={handleClose}>
     <Close />
   </Tooltag>
 </Flex>
);
 
const ModalPrompt = ({ onChange, title, message, defaultValue = ''}) => {
 const [value, setValue] = React.useState(defaultValue);
 const textProps = {
   ...modalTextProps,
   value,
   label: title,
   onChange: (e) => {
     setValue(e.target.value);
     onChange(e.target.value);
   },
 };
 return (
   <Stack>
     <Typography>{message}</Typography>
     <TextField {...textProps} />
   </Stack>
 );
};
 
export const useModal = () => {
 // Modal Methods
 // ------------------------------------------------------------------- *
 
 /**
  * shows an Alert Modal
  * @param {string} message - message to display in the dialog
  * @param {string} title - dialog title
  */
 const Alert = (message, title = "Alert") =>
   createModalMethod({
     message,
     title,
 
     // for Alert Modals, no "submitClicked" hides the Okay button
     submitClicked: null,
   });
 
 /**
  * shows a Confirm Modal
  * @param {string} message - message to display in the dialog
  * @param {string} title - dialog title
  */
 const Confirm = (message, title = "Confirm action") =>
   createModalMethod({
     message,
     title,
 
     // for Confirm Modals, Okay is enabled by default and always means TRUE
     // TODO: this should really be 2 properties. for now they happen to mean the same thing
     enableSave: true,
   });
 
 /**
  * shows a Prompt Modal
  * @param {string} message - message to display in the dialog
  * @param {string} title - dialog title
  */
 const Prompt = (message, title, value) =>
   createModalMethod({
     message,
     title,
     defaultValue: value,
     component: ModalPrompt,
   });
 
 const [modalProps, setModelProps] = React.useState({ open: false });
 
 /**
  * creates a method to open a Modal object and return its value
  * @param {object} props - props to pass into the modal
  * @returns Modal method
  */
 const createModalMethod = (props) =>
   // Modal methods are Promises whose resolution is the user response
   new Promise((resolve) => {
     setModelProps({
       // Default modal props
       // -------------------------------------------------------------- *
 
       // opens the Modal
       open: true,
 
       // when Okay is clicked, return whatever value
       // the Modal collected and close the Modal
       submitClicked: (value) => {
         resolve(value);
         setModelProps({ open: false });
       },
 
       // when Cancel is clicked, return FALSE and close the Modal
       closeClicked: () => {
         resolve(false);
         setModelProps({ open: false });
       },
 
       // User-provided props
       // -------------------------------------------------------------- *
       ...props,
     });
   });
 
 return {
   Alert,
   Confirm,
   Prompt,
   createModalMethod,
   modalProps,
 };
};
 
export default Modal;
 

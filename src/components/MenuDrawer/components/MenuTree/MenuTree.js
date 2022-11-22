import React from "react";
import {
  Box,
  MenuItem, 
  Stack,
  Typography,  
  Collapse,
  styled
} from "@mui/material";
import { ExpandMore, Star, StarBorder } from "@mui/icons-material";
import { RotateButton, TinyButton, Tooltag } from "../../..";
import { AppStateContext, useNavigation } from "../../../../hooks/AppStateContext"; 

const Truncate = styled(Box)(() => ({
  maxWidth: 280,
  overflow: 'hidden',
  textOverflow: 'ellipsis'

}))

const TreeItem = ({ 
  opt, 
  favorite, 
  setFavorite, 
  setOpen, 
  open, 
  execClose, 
  spaces, 
  borderLeft 
}) => {
  const [hover, setHover] = React.useState(false);
  const { current } = React.useContext(AppStateContext);
  const active = !!current?.path && current.path === opt.path;

  return (

    <MenuItem sx={{ ml: spaces, borderLeft }}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}>
    <Stack sx={{ width: "100%" }}>
      <Stack
        sx={{   alignItems: "center" }}
        direction="row"
      >
        {(opt.active || active) && <Box sx={{ mr: 1 }}>&bull;</Box>}
        <Tooltag component={Typography} title={opt.title}
          onClick={(e) => execClose(e, opt)}
          sx={{ fontWeight: (opt.active || active) ? 600 : 400, fontStyle: favorite ? 'italic' : 'none' }}
        >
          <Truncate>{opt.title} </Truncate>
        </Tooltag>
        <Box sx={{ flexGrow: 1 }} />
        <Stack
          sx={{   
              alignItems: "center" ,
              opacity: hover ? 1 : 0,
              transition: 'opacity 0.2s linear'
            }}
          direction="row" 
        >
          {!opt.descendants && <TinyButton onClick={() => setFavorite(opt.path)} icon={favorite ? Star : StarBorder} />}
          {!!opt.descendants && (
            <RotateButton
              deg={open ? 180 : 0}
              onClick={() => setOpen(!open)}
            >
              <ExpandMore />
            </RotateButton>
          )}
        </Stack> 
      </Stack>
      {!!opt.subtext && (
        <Typography sx={{ ml: opt.active ? 2 : 0 }} variant="caption">
          {opt.subtext}
        </Typography>
      )}
    </Stack>
  </MenuItem>

  )
}

 

const MenuTree = ({ options, spaces = 0, pinned, handleClose, filterText }) => {
  const [open, setOpen] = React.useState(true);
  const hue = pinned ? "white" : "gray";
  const borderLeft = !spaces ? "" : "solid 1px " + hue;
   

  const { getFavorite, setFavorite } = React.useContext(AppStateContext);
   
  const { navigate } = useNavigation();


  const execClose = (e, opt) => {
    if (!!opt.descendants) {
      return setOpen(!open);
    }
    !!opt.path && navigate(opt.path);
    !!opt.action && opt.action(opt);
    handleClose(e);
  };

  return (
    <>
      {options
        .filter(
          (opt) =>
            !filterText ||
            opt.title.toLowerCase().indexOf(filterText.toLowerCase()) > -1
        )
        .map((opt, i) => (
          <>
          <TreeItem 
            opt={opt}
            open={open}
            execClose={execClose}
            setOpen={setOpen}
            spaces={spaces}
            borderLeft={borderLeft}
            setFavorite={setFavorite}
            favorite={getFavorite(opt.path)}
            />  

            {/* draw menu descendant */}
            {opt.descendants && (
              <Collapse in={open}>
                <MenuTree
                  filterText={filterText}
                  pinned={pinned}
                  handleClose={handleClose}
                  options={opt.descendants}
                  spaces={spaces + 4}
                />
              </Collapse>
            )}
          </>
        ))}
    </>
  );
};

MenuTree.defaultProps = {};
export default MenuTree;

import React from "react";
import { Box, Button, Card, styled } from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip"; 
import { ExpandMore } from "@mui/icons-material";
 
export const Flex = styled(Box)(({ baseline, wrap }) => ({
 display: "flex",
 alignItems: baseline ? "flex-start" : "center",
 gap: 4,
 flexWrap: wrap ? "wrap" : "nowrap",
}));
 
export const Pane = styled(Card)(({ collapsed, theme }) => ({
 width: collapsed ? `calc(25% - 8px)` : `calc(100% - ${theme.spacing(8)})`,
 padding: theme.spacing(1),
 transition: "width 0.3s ease-in",
}));
 
const HtmlTooltip = styled(({ className, ...props }) => (
 <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
 [`& .${tooltipClasses.tooltip}`]: {
   display: "flex",
   alignItems: "center",
   backgroundColor: theme.palette.primary.background,
   color: theme.palette.primary.dark,
   border: "solid 1px " + theme.palette.primary.dark,
   maxWidth: 220,
   overflow: "hidden",
   fontSize: theme.typography.pxToRem(12),
 },
 [`& .arrow`]: {
   color: theme.palette.primary.background,
   "&::before": {
     border: "1px solid " + theme.palette.primary.dark,
     backgroundColor: "#fff",
     boxSizing: "border-box",
   },
 },
}));
 
export const Tooltag = ({
 component: Component,
 title,
 children,
 ...props
}) => (
 <HtmlTooltip arrow title={title}>
   <Component {...props}>{children}</Component>
 </HtmlTooltip>
);
 
export const Spacer = styled(Box)(() => ({
 flexGrow: 1,
}));
 
export const TextBtn = styled(Button)(() => ({
 textTransform: "capitalize",
 whiteSpace: "nowrap",
}));
 
export const UL = styled("ul")(({ theme, margin, collapsed }) => ({
 padding: 0,
 margin: margin ? theme.spacing(4) : 0,
 // marginBottom: theme.spacing(6),
 listStyle: "none",
 width: `calc(100% - ${margin ? theme.spacing(8) : 0})`,
 "& li": {
   display: "flex",
   alignItems: "center",
   float: collapsed ? "left" : "none",
   width: collapsed ? `calc(25% - 8px)` : "100%",
 },
}));
 
export const Text = styled(Box)(({ small, on }) => ({
 cursor: "pointer",
 position: "relative",
 fontSize: small ? "0.9rem" : "1rem",
 "&:hover": {
   textDecoration: "underline",
   color: "#37a",
 },
 // "&:before": {
 //   content: on ? `"Forms / "` : `""`,
 //   fontWeight: 400,
 // },
}));
 
export const Arrow = styled(ExpandMore)(({ on }) => ({
 transform: on ? "rotate(450deg)" : "rotate(270deg)",
 transition: "transform 0.3s ease-in",
}));
 
/**
* * exposes clipboard copy method to components
* @returns copy method and copied state
*/
export function useClipboard() {
 const [copied, setCopied] = React.useState(false);
 const copy = (datum) => {
   navigator.clipboard
     // * save data to clipboard
     .writeText(datum)
     .then(() => {
       // * add clipboard data to copied state
       setCopied(datum);
       // * clear copied state after pause for various coolness
       setTimeout(() => setCopied(false), 299);
     })
     .catch(console.warn);
 };
 // return method and state
 return { copy, copied };
}

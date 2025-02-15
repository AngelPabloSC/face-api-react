import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import log from "../assets/img/uide.png";
const Header = () => {
  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "white", borderBottom: "4px solid red" }}
    >
      <Toolbar
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Box
          component="img"
          src={log}
          alt="Logo UIDE"
          sx={{ height: 50, position: "absolute", left: 20 }}
        />
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "black" }}>
          Reconocimiento Facial en Vivo
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

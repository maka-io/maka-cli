/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';

// Material UI Theme config using roboto typefont and default mui.
import 'typeface-roboto'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
const theme = createMuiTheme();

import Routes from './routes.jsx';

const App = () => (
  <MuiThemeProvider theme={theme}>
  <Routes />
  </MuiThemeProvider>
);


ReactDOM.render(<App />, document.getElementById('app'));

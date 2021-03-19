/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';

import Routes from './routes.jsx';

const App = () => (
  <Routes />
);


ReactDOM.render(<App />, document.getElementById('app'));

/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';

// Server Side Rendering sink and router classifier.
import { BrowserRouter } from 'react-router-dom'
import { onPageLoad } from "meteor/server-render";
import { browserHistory } from 'react-router';

import Routes from '../lib/routes.jsx';

const App = () => (
  <BrowserRouter>
  <Routes history={browserHistory}/>
  </BrowserRouter>
);


onPageLoad(sink => {
  ReactDOM.hydrate(<App />,document.getElementById('app'));
});

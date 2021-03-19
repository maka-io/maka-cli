/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';

// Apollo Client configuration using vanilla meteor settings.
import ApolloClient from 'apollo-client';
import { meteorClientConfig } from 'meteor/apollo';
import { ApolloProvider } from 'react-apollo';
const client = new ApolloClient(meteorClientConfig());

// Server Side Rendering sink and router classifier.
import { BrowserRouter } from 'react-router-dom'
import { onPageLoad } from "meteor/server-render";
import { browserHistory } from 'react-router';

import Routes from '../lib/routes.jsx';

const App = () => (
  <BrowserRouter>
  <ApolloProvider client={client}>
  <Routes history={browserHistory}/>
  </ApolloProvider>
  </BrowserRouter>
);


onPageLoad(sink => {
  ReactDOM.hydrate(<App />,document.getElementById('app'));
});

/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';

// Apollo Client configuration using vanilla meteor settings.
import ApolloClient from 'apollo-client';
import { meteorClientConfig } from 'meteor/apollo';
import { ApolloProvider } from 'react-apollo';
const client = new ApolloClient(meteorClientConfig());

import Routes from './routes.jsx';

const App = () => (
  <ApolloProvider client={client}>
  <Routes />
  </ApolloProvider>
);


ReactDOM.render(<App />, document.getElementById('app'));

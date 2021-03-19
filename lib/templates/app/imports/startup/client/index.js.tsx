/** @namespace Client */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';
<% if (config.engines.graphql === 'apollo') {  %>
// Apollo Client configuration
import { ApolloClient } from '@apollo/client';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { ApolloProvider as ApolloHooksProvider } from '@apollo/react-hooks';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { HttpLink, createHttpLink } from 'apollo-link-http';
import { setContext } from "apollo-link-context";

const httpLink = createHttpLink({
  uri: `/graphql`
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('Meteor.loginToken');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      'x-auth-token': token,
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  // This solves a cache error.
  cache: new InMemoryCache({
    dataIdFromObject: o => {o.id ? `${o.__typename}-${o.id}`: `${o.__typename}-${o.cursor}`},
  })
});
<% } %><% if (config.engines.theme === 'material') { %>
// Material UI Theme config using  default mui.
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
});
<% } %><% if (config.engines.ssr === 'true') { %>
// Server Side Rendering sink and router classifier.
import { BrowserRouter } from 'react-router-dom'
import { onPageLoad } from "meteor/server-render";
import { browserHistory } from 'react-router';
<% } %>
<% if (config.engines.ssr === 'true') { %>import Routes from '../lib/routes';<% } else { %>import Routes from './routes';<% } %>

const App = (props) => (<% if (config.engines.ssr === 'true') { %>
  <BrowserRouter><% } %><% if (config.engines.graphql === 'apollo') { %>
  <ApolloProvider client={client}>
  <ApolloHooksProvider client={client}><% } %><% if (config.engines.theme === 'material') { %>
  <MuiThemeProvider theme={theme}><% } %><% if (config.engines.ssr === 'true') { %>
  <Routes props={props} history={browserHistory}/><% } else { %>
  <Routes props={props} /><% } %><% if (config.engines.theme === 'material') { %>
  </MuiThemeProvider><% } %><% if (config.engines.graphql === 'apollo') { %>
  </ApolloHooksProvider>
  </ApolloProvider><% } %><% if (config.engines.ssr === 'true') { %>
  </BrowserRouter><% } %>
);

const AppContainer = withTracker(props => {
  return (Meteor.isClient && Meteor.user) ? { user: (Meteor.user()) ? Meteor.user() : {} } : { user: false };
})(App);

const startApp = () => {<% if (config.engines.ssr === 'true') { %>
  onPageLoad(() => {
    ReactDOM.hydrate(<AppContainer />,document.getElementById('app'));
  });<% } else { %>
  ReactDOM.render(<AppContainer />, document.getElementById('app'));<% } %>
}

if (!Meteor.isDevelopment && Meteor.isClient) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
        .then(reg => {
            console.log('Service worker registered! 😎', reg);
            })
        .catch(err => {
            console.log('😥 Service worker registration failed: ', err);
            });
        });
  } else {
    console.warn('Service worker registration failed. Likely you are not serving content over HTTPS');
  }
}

if(window.cordova) {
  document.addEventListener('deviceready', startApp, false);
} else {
  startApp();
}

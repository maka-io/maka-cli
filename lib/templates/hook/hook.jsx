import React, { useState } from 'react';
// https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data#usetrackerreactivefn-deps-hook
import { useTracker } from 'meteor/react-meteor-data';<% if(graphql === 'apollo') { %>
// https://www.apollographql.com/docs/react/api/react/hooks/#example-2
import { useQuery, gql } from '@apollo/client';<% } %><% if (theme === 'material' ) { %>
// https://material-ui.com/styles/basics/#higher-order-component-api
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles((theme) => {});<% } %>

function <%= className %>(props) {
  const { userId } = useTracker(() => {
    const userId = Meteor.userId();
    return { userId }
  }, {/* input */});<% if(graphql === 'apollo') { %>
  const { loading, error, data } = useQuery(gql`query Todos { todos }`, { variables: {/* input */} }); <% } %><% if (theme === 'material') { %>
  const { classes } = useStyles();<% } %>

  return (
    <div>
      <h2>Find me in <%= myPath %></h2>
    </div>
  );
}

export { <%= className %> };

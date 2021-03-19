import { compose } from 'ramda'; // https://ramdajs.com/docs/#compose
<% if (client === 'react') { %>import React, { Component } from 'react';<% } else if (client === 'reflux') { %>
import React from 'react';
import PropTypes from 'prop-types';<% if ( isStore ) { %>
import { Store } from 'reflux'; <% } else { %>
import { Component } from 'reflux';<% } %><% } %>
// https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data#withtrackerreactivefn-higher-order-component
import { withTracker } from 'meteor/react-meteor-data';<% if(graphql === 'apollo') { %>
import { gql } from '@apollo/client';
// https://www.apollographql.com/docs/react/api/react/hoc/#graphqlquery-configcomponent
import { graphql } from '@apollo/client/react/hoc';<% } %><% if (theme === 'material' ) { %>
// https://material-ui.com/styles/basics/#higher-order-component-api
import { withStyles } from '@material-ui/core/styles';

const styles = (theme) => { };<% } %>
<% if (!isStore) { %>
class <%= className %>Component extends Component {<% } else { %>
class <%= className %>Component extends Store { <% } %><% if (client === 'reflux' && isStore) { %>
  constructor() {
    super();
    this.state = {};
  }<% } else { %>
  /**
   * Define types for your props for stability.
   */
  static propTypes = {};

  /**
   * If a prop is not required, it is a good idea to provide
   * it a default value
   */
  static defaultProps = {};

  /**
   * Setup the component.  Best practices are to keep this light,
   * and offload complex behavior to methods.
   */
  constructor(props) {
    super(props);
    this.state = {};<% if (client === 'reflux') { %>
    this.stores = [];
    this.storeKeys = [];<% } %>
  }<% } %>

  /**
   * This method runs after the component output has been rendered to the DOM.
   * This is where you can start to interact with HTML elements, such as <div>,
   * or attach event listeners to DOM elements.
   */
  componentDidMount() { }

  /**
   * This is where the DOM will be torn down.  A good idea is to clean up any
   * event listeners you've created in the componentDidMount() method.
   */
  componentWillUnmount() {<% if (client === 'reflux' && !isStore) { %> super.componentWillUnmount();<% }%> }

  /**
   * This is the main render method, and will rerun anytime either this.state or this.props is changed.
   */
  render() {<% if (isStore) { %>
    return null;<% } else { %>
    return (
      <div id="<% if (isComponent) { %><%= cssCaseName %>-component<% } else { %><%= cssCaseName %><% } %>">
        <h2>Find me in <%= myPath %></h2>
      </div>
    );<% } %>
  }
}

const <%= className %> = compose(
  withTracker(() => {}),<% if(graphql === 'apollo') { %>
  graphql(gql`query Todos { todos }`, { variables: {/* input */} }),<% } %><% if(theme === 'material') { %>
  withStyles(styles),<% } %>
)(<%= className %>Component);

export { <%= className %> };

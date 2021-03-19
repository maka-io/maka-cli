import { compose } from 'ramda'; // https://ramdajs.com/docs/#compose
<% if (client === 'react') { %>import * as React from 'react';<% } else if (client === 'reflux') { %>
import * as React from 'react';
import Reflux from 'reflux';<% } %>
// https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data#withtrackerreactivefn-higher-order-component
import { withTracker } from 'meteor/react-meteor-data';<% if(graphql === 'apollo') { %>
import { gql } from '@apollo/client';
// https://www.apollographql.com/docs/react/api/react/hoc/#graphqlquery-configcomponent
import { graphql } from '@apollo/client/react/hoc';<% } %><% if (theme === 'material' ) { %>
// https://material-ui.com/styles/basics/#higher-order-component-api
import { withStyles } from '@material-ui/core/styles';

const styles = (theme) => { };<% } %>

interface <%= className %>Component { 
  props: Props;
  state: object;
}
<% if (client === 'reflux') { %>
class <%= className %>Component extends Reflux.Component<<%= className %>Component> {<% } else { %>
class <%= className %>Component extends React.Component<<%= className %>Component> {<% } %>
  static propTypes = {}

  static defaultProps = {}

  constructor(props:Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { }

  componentWillUnmount() {<% if (client === 'reflux' && !isStore) { %>
    super.componentWillUnmount();<% }%>
  }

  render() { return (<div id="<%=fileName%>">{ this.props.children }</div>); }
}

const <%= className %> = compose(
  withTracker(() => {}),<% } %><% if(graphql === 'apollo') { %>
  graphql(gql`query Todos { todos }`, { variables: {/* input */} }),<% if(theme === 'material') { %>
  withStyles(styles),<% } %>
)(<%= className %>Component);

export { <%= className %> };

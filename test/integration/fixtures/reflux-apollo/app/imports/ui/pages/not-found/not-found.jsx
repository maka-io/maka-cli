import './not-found.css';
import React from 'react';
import { Component } from 'reflux';
import { withTracker } from 'meteor/react-meteor-data';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag'; 

class NotFoundComponent extends Component {
  static propTypes = {}

  static defaultProps = {}

  constructor(props) {
    super(props);
    this.state = {};
      this.store = null;
  }

  componentWillMount() {
    super.componentWillMount();
  }

  componentDidMount() { }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  render() {
    return (<h2 className="not-found">Find me in app/imports/ui/pages/not-found/not-found</h2>);
  }
}
const NotFound = compose(
  //graphql(),
  withTracker(() => { return {}; })
)(NotFoundComponent);

export { NotFound, NotFoundComponent };

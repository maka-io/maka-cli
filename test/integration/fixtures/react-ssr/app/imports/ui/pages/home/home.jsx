import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

class HomeComponent extends Component {
  static propTypes = {}

  static defaultProps = {}

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
  }

  componentDidMount() { }

  componentWillUnmount() {
  }

  render() {
    return (<h2 className="home">Find me in app/imports/ui/pages/home/home</h2>);
  }
}
const Home = withTracker(() => { return {}; })(HomeComponent);

export { Home, HomeComponent };

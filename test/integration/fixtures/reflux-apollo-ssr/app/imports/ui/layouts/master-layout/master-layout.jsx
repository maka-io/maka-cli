import React, { Component } from 'react';

class MasterLayoutComponent extends Component {
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

  componentDidCatch(error, info) { console.log(error, info); }

  render() { return (<div>{ this.props.children }</div>); }
}

const MasterLayout = MasterLayoutComponent;
export { MasterLayout, MasterLayoutComponent };

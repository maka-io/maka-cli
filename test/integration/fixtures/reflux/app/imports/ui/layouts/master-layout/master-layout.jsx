import './master-layout.css';
import React from 'react';
import { Component } from 'reflux';

class MasterLayoutComponent extends Component {
  static propTypes = {}

  static defaultProps = {}

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    super.componentWillMount();
  }

  componentDidMount() { }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  componentDidCatch(error, info) { console.log(error, info); }

  render() { return (<div>{ this.props.children }</div>); }
}

const MasterLayout = MasterLayoutComponent;
export { MasterLayout, MasterLayoutComponent };

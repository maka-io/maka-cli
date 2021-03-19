import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';

/**
 * The React Router client and server side routing definitions.
 * @namespace Common.Routes
 * @desc This is the main definition for the react router.
 */

import * as Component from './templates.jsx';

const Root = (
  <Route path="/" component={ Component.MasterLayout }>
    <IndexRoute component={ Component.Home }/>
  </Route>
);

const CatchAll = (
  <Route path="*" component={ Component.MasterLayout }>
    <IndexRoute component={ Component.NotFound }/>
  </Route>
);

const privateRoutes = (<>
  {Root}
  {CatchAll}
</>);

const publicRoutes = (<>
  {Root}
  {CatchAll}
</>);

const PrivateRoutes = ({ history }) => (
  <Router history={ history }>
    {privateRoutes}
  </Router>
);
const PublicRoutes = ({ history }) => (
  <Router history={ history }>
    {publicRoutes}
  </Router>
);
const Routes = ({ user = {}, history }) => (
  (user._id) ? <PrivateRoute history={history}/> : <PublicRoutes history={history}/>
);

export default Routes;

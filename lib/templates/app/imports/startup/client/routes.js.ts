import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

/**
 * The FlowRouter client side routing definitions.
 * @namespace Client.Routes
 */

import './templates.ts';

/**
 * * Name: Root 
 * * URL: /
 * * Layout: MasterLayout
 * * Template: Home
 * @memberof Client.Routes
 * @member Home
 */
FlowRouter.route('/', {
  name: 'Root',
  action() {
    BlazeLayout.render('MasterLayout', {yield: "Home"});
  }
});

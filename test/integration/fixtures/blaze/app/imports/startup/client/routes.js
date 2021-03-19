import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

/**
 * The FlowRouter client side routing definitions.
 * @namespace Client.Routes
 */

import './templates.js';


/**
 * * Name: Home
 * * URL: /
 * * Layout: MasterLayout
 * * Template: Home
 * @memberof Client.Routes
 * @member Home
 */
FlowRouter.route('/', {
  name: 'Home',
  action() {
    BlazeLayout.render('MasterLayout', {yield: "Home"});
  }
});
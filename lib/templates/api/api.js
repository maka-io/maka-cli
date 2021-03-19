import { Meteor } from 'meteor/meteor';
<% if (api === 'rest') { %>import { Restivus } from 'meteor/maka:rest';<% } else { %>import { Restivus } from 'meteor/nimble:restivus';<% } %>
import <%= name %> from './<%= fileName %>-collection';

/**
 * RESTful create, read, update, delete (CRUD) API.
 * By default this is disabled, please refer to the
 * advanced usage and customization
 * of this server side routing, at:
 * {@link https://github.com/kahmali/meteor-restivus/}
 *
 * *To enable, uncomment the last line in this file.*
 *
 * @memberof Server.<%= name %>
 */
const <%= name %>ApiV1 = new Restivus({
    version: 'v1',
    useDefaultAuth: true,
    prettyJson: Meteor.isDevelopment
});
<%= name %>ApiV1.addCollection(<%= name %>);

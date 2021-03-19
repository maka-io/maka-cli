import { Meteor } from 'meteor/meteor';
<% if (api === 'rest') { %>import { Restivus } from 'meteor/maka:rest';<% } else { %>import { Restivus } from 'meteor/nimble:restivus';<% } %>
import <%= name %> from './<%= fileName %>-collection';

const <%= name %>ApiV1 = new Restivus({
  version: 'v1',
  useDefaultAuth: true,
  prettyJson: Meteor.isDevelopment
});

<%= name %>ApiV1.addCollection(<%= name %>);

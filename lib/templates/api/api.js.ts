import { Meteor } from 'meteor/meteor';
import { Restivus } from 'meteor/nimble:restivus';
import <%= name %> from './<%= fileName %>-collection';

/**
 * For advanced usage and customization
 * of this object, refer to:
 * {@link https://github.com/kahmali/meteor-restivus/}
 *
 * @memberof Server.<%= name %>
 *
 */
const <%= name %>ApiV1 = new Restivus({
    version: 'v1',
    useDefaultAuth: true,
    prettyJson: Meteor.isDevelopment
});

<%= name %>ApiV1.addCollection(<%= name %>);

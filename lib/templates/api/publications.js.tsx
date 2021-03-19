import { Meteor } from 'meteor/meteor';
import <%= name %> from './<%= fileName %>-collection';

/**
 * Collection publications to the client.  Publications must
 * return a cursor object.
 *
 * @memberof Server.<%= name %>
 * @member Publications
 */
Meteor.publish('<%= fileName %>.public', function <%= camelCase %>Public() {
  const cursor = <%= name %>.find({
    userId: { $exists: false },
  }, {
    fields: <%= name %>.publicFields,
  });

  return cursor;
});

Meteor.publish('<%= fileName %>.private', function <%= camelCase %>Private() {
  if (!this.userId) {
    return this.ready();
  }

  const cursor = <%= name %>.find({
    userId: this.userId,
  }, {
    fields: <%= name %>.privateFields,
  });

  return cursor;
});

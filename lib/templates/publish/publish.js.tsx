Meteor.publish('<%= name %>', () => {
  return <%= collection %>.find();
});

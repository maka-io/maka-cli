/**
 * * Name: <%= name %>
 * * URL: <%= url %>
 * * Layout: <%= layout %>
 * * Template: <%= templateName %>
 * @memberof Client.Routes
 * @member <%= name %>
 */
FlowRouter.route('<%= url %>', {
  name: '<%= name %>',
  action() {
    BlazeLayout.render('<%= layout %>', {yield: "<%= templateName %>"});
  }
});

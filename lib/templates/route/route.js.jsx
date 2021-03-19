<% if (newForm) { %>const <%= templateName %> = (<% } %>
  <Route path="<%= url %>" component={Component.<%= layout %>}>
    <IndexRoute component={Component.<%= templateName %>}/>
  </Route>
<% if (newForm) { %>);<% } %>

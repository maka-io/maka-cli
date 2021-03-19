<% if (type === 'pgsql') { %>
const pgLocalConfig = {
    pgUser:             '',
    pgDatabase:         '',
    pgPassword:         '',
    pgHost:             'localhost',
    pgPort:             5432,
    pgMaxPoolClients:   10,
    pgTimeoutMilli:     5000
};

export default pgLocalConfig ;
<% } else if (type === 'mssql') { %>
const msLocalConfig = {
    msHost: '',
    msDb:   '',
    msUser: '',
    msPassword: '',
    msPort: 1433,
    msTimeoutMilli: 20000,
    msMaxPoolClients: 10,
    msPoolTimeoutMilli: 30000
};

export default msLocalConfig;
<% } else if (type === 'mysql') { %>


<% } else if (type === 'mongo') { %>
const mgConfig = {
  mgHost: 'localhost',
  mgPort: 27017,
  mgDb:   ''
};

const mgLocalConfig = `mongodb://${mgConfig.mgHost}:${mgConfig.mgPort}/${mgConfig.mgDb}`;
export default mgConfig;
<% } else if (type === 'sqlite') { %>
const liteLocalConfig = {
  memory: true,
  readonly: false,
  fileMustExist: false
};
export default liteLocalConfig;
<% } %>

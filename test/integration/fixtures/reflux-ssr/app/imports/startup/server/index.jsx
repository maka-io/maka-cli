/** @namespace Server */

import Routes from '../lib/routes.jsx';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { onPageLoad } from 'meteor/server-render';
import { StaticRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';




import { ServerStyleSheet } from 'styled-components';

onPageLoad(sink => {
    const history = createMemoryHistory(sink.request.url.pathname);

    const App = (props) => (
        <StaticRouter
            location={props.location}
            context={{}}>
            <Routes history={history}/>
        </StaticRouter>
    );
    
    const sheet = new ServerStyleSheet();
    const html = renderToStaticMarkup(sheet.collectStyles(
        <App location={sink.request.url} />
    ));

    sink.appendToHead(sheet.getStyleTags());
    

    sink.renderIntoElementById('app', html);

});

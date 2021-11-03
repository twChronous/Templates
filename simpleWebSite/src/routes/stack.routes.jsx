import React from 'react';
import {
  Switch,
  Route,
  BrowserRouter as Router,
} from 'react-router-dom';
import { PageLanding, NotFound } from '../pages';

function router() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={PageLanding} />
        <Route component={NotFound} />
      </Switch>
    </Router>

  );
}

export default router;
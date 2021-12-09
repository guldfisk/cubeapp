import React from "react";
import {NavTab, RoutedTabs as _RoutedTabs} from "react-router-tabs";
import {Redirect} from "react-router";
import {Route, Switch} from "react-router-dom";

import {urlJoin} from "./utils";


interface RoutedTabsProps {
  match: any
  tabs: [string, string, () => JSX.Element][]
  defaultTab: string
}

const RoutedTabs = (props: RoutedTabsProps) => {
  return (
    <div>
      <_RoutedTabs
        tabClassName="nav-item nav-link"
        className="nav nav-tabs"
      >
        {
          props.tabs.map(
            ([key, name]) => (
              <NavTab to={urlJoin(props.match.url, key)} key={key}>
                {name}
              </NavTab>
            )
          )
        }
      </_RoutedTabs>

      <Switch>
        <Route
          exact
          path={`${props.match.url}`}
          render={() => <Redirect to={urlJoin(props.match.url, props.defaultTab)}/>}
        />
        {
          props.tabs.map(
            ([key, , render]) => (
              <Route
                key={key}
                path={urlJoin(props.match.url, key)}
                render={render}
              />
            )
          )
        }
      </Switch>
    </div>
  );
};

export default RoutedTabs;

import React from "react";


interface FeedLinkProps {
  url: string
}


export const FeedLink: React.FunctionComponent<FeedLinkProps> = (props: FeedLinkProps) => {
  return <a
    rel="alternate"
    type="application/rss+xml"
    title="News"
    href={props.url}
  >
    RSS
  </a>
};

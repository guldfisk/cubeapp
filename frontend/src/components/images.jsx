import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cubeable_images_url, get_cardback_image_url} from "./utils.jsx";


export const CubeableImage = ({id, type='printing', sizeSlug='medium'}) => {
  return <LazyImage
    src={
      get_cubeable_images_url(
        id,
        type,
        sizeSlug,
      )
    }
    placeholder={({imageProps, ref}) => (
      <
        img
        ref={ref}
        src={get_cardback_image_url(sizeSlug)}
        alt={imageProps.alt}
      />
    )}
    actual={({imageProps}) => <img {...imageProps} />}
  />
};

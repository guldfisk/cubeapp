import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cubeable_images_url, get_cardback_image_url} from "./utils";


interface CubeableImageProps {
  id: string
  type?: string
  sizeSlug?: string
}

export const CubeableImage: React.FunctionComponent<CubeableImageProps> = (
  {id, type = 'printing', sizeSlug = 'medium'}: CubeableImageProps
) => {
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

import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cardback_image_url, get_cubeable_images_url} from "./utils/utils";
import {Cubeable} from "./models/models";


interface CubeableImageProps {
  cubeable: Cubeable
  sizeSlug?: string
  onClick?: null | ((cubeable: Cubeable) => void)
}

export const CubeableImage: React.FunctionComponent<CubeableImageProps> = (
  {cubeable, sizeSlug = 'medium', onClick = null}: CubeableImageProps
) => {

  return <LazyImage
    src={
      get_cubeable_images_url(
        cubeable.id(),
        cubeable.type(),
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
    {...(onClick === null ? {} : {onClick: () => onClick(cubeable)})}
  />;

};

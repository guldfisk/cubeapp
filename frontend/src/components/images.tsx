import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cardback_image_url, get_cubeable_images_url} from "./utils/utils";
import {Cubeable} from "./models/models";


const imageSizeMap: {[key: string]: [number, number]} = {
  'original': [745, 1040],
  'medium': [372, 520],
  'small': [223, 312],
  'thumbnail': [111, 156],
};

interface CubeableImageProps {
  cubeable?: Cubeable
  sizeSlug?: string
  onClick?: null | ((cubeable: Cubeable) => void)
  id?: string | number
  type?: string
}

export const CubeableImage: React.FunctionComponent<CubeableImageProps> = (
  {cubeable = null, sizeSlug = 'medium', onClick = null, id=null, type=null}: CubeableImageProps
) => {
  const [width, height]: [number, number] = imageSizeMap[sizeSlug];
  return <LazyImage
    src={
      get_cubeable_images_url(
        cubeable === null ? id.toString() : cubeable.id,
        cubeable === null ? type : cubeable.getType(),
        sizeSlug,
      )
    }
    placeholder={({imageProps, ref}) => (
      <
        img
        ref={ref}
        src={get_cardback_image_url(sizeSlug)}
        alt={imageProps.alt}
        width={width}
        height={height}
      />
    )}
    actual={({imageProps}) => <img {...imageProps} />}
    {...(onClick === null ? {} : {onClick: () => onClick(cubeable)})}
  />;

};

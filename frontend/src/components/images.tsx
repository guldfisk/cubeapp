import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cardback_image_url, get_imageable_image_url, get_imageable_image_static_url} from "./utils/utils";
import {Imageable} from "./models/models";


const imageSizeMap: { [key: string]: [number, number] } = {
  'original': [745, 1040],
  'medium': [372, 520],
  'small': [223, 312],
  'thumbnail': [111, 156],
};


interface BackImageProps {
  sizeSlug?: string
  cropped?: boolean
}


export const BackImage: React.FunctionComponent<BackImageProps> = (
  {
    sizeSlug = 'medium',
    cropped = false,
  }: BackImageProps
) => {
  const [width, height]: [number, number] = cropped ? croppedImageSizeMap[sizeSlug] : imageSizeMap[sizeSlug];

  return <img
    src={get_cardback_image_url(sizeSlug, cropped)}
    width={width}
    height={height}
    alt="Cardback"
  />
};


const croppedImageSizeMap: { [key: string]: [number, number] } = {
  'original': [560, 435],
  'medium': [280, 217],
  'small': [168, 130],
  'thumbnail': [84, 65],
};


interface CubeableImageProps {
  imageable?: Imageable
  sizeSlug?: string
  onClick?: null | ((imageable: Imageable) => void)
  id?: string | number
  type?: string
  cropped?: boolean
  allowStatic?: boolean
  hover?: boolean
}


export const ImageableImage: React.FunctionComponent<CubeableImageProps> = (
  {
    imageable = null,
    sizeSlug = 'medium',
    onClick = null,
    id = null,
    type = null,
    cropped = false,
    hover = false,
    allowStatic = false,
  }: CubeableImageProps
) => {
  if (!id && !imageable) {
    return <div/>
  }
  const [width, height]: [number, number] = cropped ? croppedImageSizeMap[sizeSlug] : imageSizeMap[sizeSlug];
  const _type = imageable === null ? type : imageable.getType();


  const image = <LazyImage
    src={
      (
        allowStatic && _type !== 'Cardboard' && !window.__debug__ && !cropped ?
          get_imageable_image_static_url
          : get_imageable_image_url
      )(
        imageable === null ? id.toString() : imageable.id,
        _type,
        sizeSlug,
        cropped,
      )
    }
    placeholder={({imageProps, ref}) => (
      <img
        ref={ref}
        src={get_cardback_image_url(sizeSlug, cropped)}
        alt={imageProps.alt}
        width={width}
        height={height}
      />
    )}
    actual={({imageProps}) => <img {...imageProps} />}
    {...(onClick === null ? {} : {onClick: () => onClick(imageable)})}
  />;

  if (!hover) {
    return image
  }
  return <a
    data-tip={imageable.id.toString()}
    data-for={imageable.toolTipType()}
  >
    {image}
  </a>

};

import React from 'react';

import {LazyImage} from "react-lazy-images";

import {get_cardback_image_url, get_imageable_image_url, get_imageable_image_static_url} from "./utils/utils";
import {Imageable} from "./models/models";
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import {flip, preventOverflow} from "@popperjs/core";


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
  imageable?: null | Imageable
  sizeSlug?: string
  onClick?: null | ((imageable: Imageable) => void)
  id?: string | number
  type?: string
  cropped?: boolean
  allowStatic?: boolean
  hover?: boolean
  hoverSizeSlug?: string
  style?: any
}


export class ImageableImage extends React.Component<CubeableImageProps> {

  public static defaultProps = {
    hover: true,
    cropped: false,
    hoverSizeSlug: 'medium',
    sizeSlug: 'medium',
    // @ts-ignore
    imageable: null,
    allowStatic: false,
  };

  render() {
    if (!this.props.id && !this.props.imageable) {
      return <div/>
    }
    const [width, height]: [number, number] = this.props.cropped ? croppedImageSizeMap[this.props.sizeSlug] : imageSizeMap[this.props.sizeSlug];
    const _type = this.props.imageable === null ? this.props.type : this.props.imageable.getType();

    const apiUrl = get_imageable_image_url(
      this.props.imageable === null ? this.props.id.toString() : this.props.imageable.id,
      _type,
      this.props.sizeSlug,
      this.props.cropped,
    );

    const canUseStatic = this.props.allowStatic && _type !== 'Cardboard' && !window.__debug__ && !this.props.cropped;

    const srcUrl = canUseStatic ? get_imageable_image_static_url(
      this.props.imageable === null ? this.props.id.toString() : this.props.imageable.id,
      _type,
      this.props.sizeSlug,
      this.props.cropped,
    ) : apiUrl;

    const image = <LazyImage
      error={canUseStatic ? (() => <img src={apiUrl}/>) : null}
      src={srcUrl}
      placeholder={({imageProps, ref}) => (
        <img
          ref={ref}
          src={get_cardback_image_url(this.props.sizeSlug, this.props.cropped)}
          alt={imageProps.alt}
          width={width}
          height={height}
          style={this.props.style}
        />
      )}
      actual={({imageProps}) => <img style={this.props.style} {...imageProps} />}
      {...(this.props.onClick === null ? {} : {onClick: () => this.props.onClick(this.props.imageable)})}
    />;

    if (!this.props.hover) {
      return image
    }


    return <OverlayTrigger
      placement='left'
      delay={{show: 250, hide: 0}}
      overlay={
        <ImageableImage
          hover={false}
          id={this.props.id}
          type={this.props.type}
          allowStatic={this.props.allowStatic}
          sizeSlug={this.props.hoverSizeSlug}
          imageable={this.props.imageable}
          onClick={null}
          cropped={false}
        />
      }
      popperConfig={{
        modifiers: [flip, preventOverflow],
      }}
    >
      {image}
    </OverlayTrigger>
    // return
  }
}

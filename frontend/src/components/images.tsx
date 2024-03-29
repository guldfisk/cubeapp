import React from 'react';

import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import {flip, preventOverflow} from "@popperjs/core";
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
    allowStatic: true,
  };

  render() {
    if (!this.props.id && !this.props.imageable) {
      return <div/>
    }
    const [width, height]: [number, number] = this.props.cropped ? croppedImageSizeMap[this.props.sizeSlug] : imageSizeMap[this.props.sizeSlug];
    const _type = this.props.imageable === null ? this.props.type : this.props.imageable.getType();
    const imageableId = this.props.imageable ? this.props.imageable.id : this.props.id.toString();
    const explanation = this.props.imageable ? this.props.imageable.representation() : this.props.id.toString();

    const apiUrl = get_imageable_image_url(
      imageableId,
      _type,
      this.props.sizeSlug,
      this.props.cropped,
    );

    const canUseStatic = this.props.allowStatic && _type !== 'Cardboard' && !window.__debug__ && !this.props.cropped;

    const srcUrl = canUseStatic ? get_imageable_image_static_url(
      imageableId,
      _type,
      this.props.sizeSlug,
      this.props.cropped,
    ) : apiUrl;

    const getPlaceholder = ({imageProps, ref}: any) => (
      <img
        ref={ref}
        src={get_cardback_image_url(this.props.sizeSlug, this.props.cropped)}
        alt={imageProps.alt}
        width={width}
        height={height}
        style={this.props.style}
      />
    )

    const getErrorDiv = () => <div className="image-error" style={{width, height}}>
      <span>{explanation}</span>
    </div>
    const image = <LazyImage
      error={
        () => canUseStatic && _type === 'Printing' ? <LazyImage
          placeholder={getPlaceholder}
          src={apiUrl}
          actual={({imageProps}) => <img style={this.props.style} {...imageProps} />}
          error={getErrorDiv}
          alt={explanation}
        /> : getErrorDiv()
      }
      src={srcUrl}
      placeholder={getPlaceholder}
      actual={({imageProps}) => <img style={this.props.style} {...imageProps} />}
      alt={explanation}
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
  }
}
